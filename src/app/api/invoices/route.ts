import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { calculateInvoiceTotal } from "@/lib/utils";
import { InvoiceStatus } from "@prisma/client";
import { syncAllInvoicesForMonth } from "@/lib/services/additional-fee-sync";

// GET /api/invoices - list invoices with filters, auto-checks OVERDUE
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const month = searchParams.get("month") || undefined;
    const status = (searchParams.get("status") as InvoiceStatus) || undefined;
    const roomId = searchParams.get("roomId") || undefined;
    const tenantId = searchParams.get("tenantId") || undefined;
    const search = searchParams.get("search")?.trim();

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "20"));

    // Auto update status to OVERDUE if dueDate < now and status == UNPAID
    const now = new Date();
    await prisma.invoice.updateMany({
      where: {
        status: "UNPAID",
        dueDate: { lt: now },
      },
      data: { status: "OVERDUE" },
    });

    // Tự động đồng bộ các khoản chi phí phát sinh mới vào hóa đơn chưa thanh toán
    await syncAllInvoicesForMonth(month);

    const where: any = {};
    if (month) where.month = month;
    if (status) where.status = status;
    if (roomId) where.roomId = roomId;
    if (tenantId) where.tenantId = tenantId;
    if (search) {
      where.OR = [
        { tenant: { user: { fullName: { contains: search, mode: "insensitive" } } } },
        { room: { roomNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ month: "desc" }, { createdAt: "desc" }],
        include: {
          tenant: {
            include: {
              user: { select: { fullName: true, phone: true, email: true } },
            },
          },
          room: {
            include: {
              property: { select: { id: true, name: true } },
            },
          },
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      }),
    ]);

    // Lấy chi tiết các khoản chi phí phát sinh đi kèm cho từng hóa đơn
    const roomIds = invoices.map((i) => i.roomId);
    const months = Array.from(new Set(invoices.map((i) => i.month)));
    let allFees: any[] = [];
    try {
      allFees = await (prisma as any).additionalFee.findMany({
        where: {
          roomId: { in: roomIds },
          month: { in: months },
        },
        orderBy: { date: "desc" },
      });
    } catch {
      allFees = [];
    }

    const enriched = invoices.map((inv) => {
      const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      const remainingAmount = Math.max(0, inv.total - paidAmount);
      const itemFees = allFees.filter((f) => f.roomId === inv.roomId && f.month === inv.month);
      return {
        ...inv,
        paidAmount,
        remainingAmount,
        additionalFees: itemFees,
      };
    });

    return successResponse({
      items: enriched,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tải danh sách hóa đơn", 500);
  }
}

// POST /api/invoices - create single invoice
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    const {
      tenantId,
      roomId,
      month,
      roomFee = 0,
      electricFee = 0,
      waterFee = 0,
      serviceFee = 0,
      otherFee = 0,
      previousDebt = 0,
      discount = 0,
      dueDate,
    } = body;

    if (!tenantId || !roomId || !month || !dueDate) {
      return errorResponse("Vui lòng nhập đầy đủ thông tin hóa đơn", 400);
    }

    // Nếu không nhập otherFee hoặc bằng 0, tự động gom từ chi phí phát sinh phòng tháng này
    let finalOtherFee = Number(otherFee);
    if (!finalOtherFee || finalOtherFee === 0) {
      try {
        const fees = await (prisma as any).additionalFee.findMany({
          where: { roomId, month },
        });
        finalOtherFee = fees.reduce((sum: number, f: any) => sum + f.amount, 0);
      } catch {
        finalOtherFee = 0;
      }
    }

    const total = calculateInvoiceTotal({
      roomFee: Number(roomFee),
      electricFee: Number(electricFee),
      waterFee: Number(waterFee),
      serviceFee: Number(serviceFee),
      otherFee: finalOtherFee,
      previousDebt: Number(previousDebt),
      discount: Number(discount),
    });

    const due = new Date(dueDate);
    const isOverdue = due < new Date();

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        roomId,
        month,
        roomFee: Number(roomFee),
        electricFee: Number(electricFee),
        waterFee: Number(waterFee),
        serviceFee: Number(serviceFee),
        otherFee: finalOtherFee,
        previousDebt: Number(previousDebt),
        discount: Number(discount),
        total,
        dueDate: due,
        status: isOverdue ? "OVERDUE" : "UNPAID",
      },
      include: {
        tenant: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        room: true,
      },
    });

    return successResponse(invoice, "Tạo hóa đơn thành công", 201);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tạo hóa đơn", 500);
  }
}
