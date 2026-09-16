import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // 1. Room stats
    const [totalRooms, occupiedRooms, availableRooms, maintenanceRooms] =
      await Promise.all([
        prisma.room.count(),
        prisma.room.count({ where: { status: "OCCUPIED" } }),
        prisma.room.count({ where: { status: "AVAILABLE" } }),
        prisma.room.count({ where: { status: "MAINTENANCE" } }),
      ]);

    // 2. Tenants count
    const totalTenants = await prisma.tenant.count({
      where: { status: "ACTIVE" },
    });

    // 3. Current month revenue (sum of payments made in current month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthPayments = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    });
    const currentMonthRevenue = currentMonthPayments._sum.amount || 0;

    // 4. Invoices unpaid and overdue stats
    const [unpaidInvoices, overdueInvoicesCount] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          status: { in: ["UNPAID", "OVERDUE"] },
        },
        include: {
          payments: true,
        },
      }),
      prisma.invoice.count({
        where: { status: "OVERDUE" },
      }),
    ]);

    // Calculate total unpaid debt
    const totalUnpaidAmount = unpaidInvoices.reduce((acc, inv) => {
      const paid = inv.payments.reduce((pAcc, p) => pAcc + p.amount, 0);
      return acc + Math.max(0, inv.total - paid);
    }, 0);

    // 5. Revenue chart for the last 6 months
    const monthList: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthList.push(mStr);
    }

    const revenueChartData = await Promise.all(
      monthList.map(async (m) => {
        const [year, month] = m.split("-").map(Number);
        const sDate = new Date(year, month - 1, 1);
        const eDate = new Date(year, month, 0, 23, 59, 59);

        const [paymentSum, invoiceSum] = await Promise.all([
          prisma.payment.aggregate({
            where: { paymentDate: { gte: sDate, lte: eDate } },
            _sum: { amount: true },
          }),
          prisma.invoice.aggregate({
            where: { month: m },
            _sum: { total: true },
          }),
        ]);

        return {
          month: `T${month}/${year.toString().slice(2)}`,
          revenue: paymentSum._sum.amount || 0,
          expected: invoiceSum._sum.total || 0,
        };
      })
    );

    // 6. Occupancy chart data
    const occupancyData = [
      { name: "Đang thuê", value: occupiedRooms, color: "#3b82f6" },
      { name: "Phòng trống", value: availableRooms, color: "#10b981" },
      { name: "Đang bảo trì", value: maintenanceRooms, color: "#f59e0b" },
    ];

    // 7. Recent Invoices
    const recentInvoices = await prisma.invoice.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        room: { select: { roomNumber: true } },
        tenant: {
          include: { user: { select: { fullName: true } } },
        },
        payments: true,
      },
    });

    // 8. Recent Payments
    const recentPayments = await prisma.payment.findMany({
      take: 6,
      orderBy: { paymentDate: "desc" },
      include: {
        invoice: {
          include: {
            room: { select: { roomNumber: true } },
            tenant: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
      },
    });

    return successResponse({
      kpi: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        totalTenants,
        currentMonthRevenue,
        totalUnpaidAmount,
        overdueInvoicesCount,
      },
      charts: {
        revenueChartData,
        occupancyData,
      },
      recentInvoices,
      recentPayments,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tải dữ liệu dashboard", 500);
  }
}
