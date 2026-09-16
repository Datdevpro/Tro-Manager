import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET /api/tenant/payments - list payments for current tenant
export async function GET() {
  try {
    const session = await requireAuth();

    const tenant = await prisma.tenant.findUnique({
      where: { userId: session.userId },
    });

    if (!tenant) {
      return errorResponse("Không tìm thấy thông tin cư dân", 404);
    }

    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          tenantId: tenant.id,
        },
      },
      orderBy: { paymentDate: "desc" },
      include: {
        invoice: {
          select: {
            id: true,
            month: true,
            total: true,
            room: { select: { roomNumber: true } },
          },
        },
      },
    });

    return successResponse(payments);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    return errorResponse("Lỗi khi tải lịch sử thanh toán", 500);
  }
}
