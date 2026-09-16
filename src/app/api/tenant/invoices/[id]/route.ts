import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

interface Params {
  params: { id: string };
}

// GET /api/tenant/invoices/[id] - view invoice detail with strict ownership verification
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        tenant: true,
        room: {
          include: {
            property: true,
            roomServices: { include: { service: true } },
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!invoice) {
      return errorResponse("Không tìm thấy hóa đơn", 404);
    }

    // Ownership check (anti-IDOR)
    if (invoice.tenant.userId !== session.userId) {
      return errorResponse("Bạn không có quyền truy cập hóa đơn của cư dân khác", 403);
    }

    const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, invoice.total - paid);

    return successResponse({
      ...invoice,
      paidAmount: paid,
      remainingAmount: remaining,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    return errorResponse("Lỗi khi tải chi tiết hóa đơn", 500);
  }
}
