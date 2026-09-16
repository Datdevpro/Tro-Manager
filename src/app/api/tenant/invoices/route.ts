import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET /api/tenant/invoices - list only the current tenant's invoices
export async function GET() {
  try {
    const session = await requireAuth();

    const tenant = await prisma.tenant.findUnique({
      where: { userId: session.userId },
    });

    if (!tenant) {
      return errorResponse("Không tìm thấy thông tin cư dân", 404);
    }

    const invoices = await prisma.invoice.findMany({
      where: { tenantId: tenant.id },
      orderBy: [{ month: "desc" }, { createdAt: "desc" }],
      include: {
        room: {
          include: {
            property: { select: { name: true } },
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    const enriched = invoices.map((inv) => {
      const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        ...inv,
        paidAmount: paid,
        remainingAmount: Math.max(0, inv.total - paid),
      };
    });

    return successResponse(enriched);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    return errorResponse("Lỗi tải danh sách hóa đơn", 500);
  }
}
