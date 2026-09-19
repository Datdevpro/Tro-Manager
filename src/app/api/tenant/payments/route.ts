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

// POST /api/tenant/payments - Tenant submits payment
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const tenant = await prisma.tenant.findUnique({
      where: { userId: session.userId },
      include: { user: true },
    });

    if (!tenant) {
      return errorResponse("Không tìm thấy thông tin cư dân", 404);
    }

    const body = await req.json();
    const { invoiceId, amount, paymentMethod = "BANK_TRANSFER", note } = body;

    const payAmount = Number(amount);
    if (!invoiceId || isNaN(payAmount) || payAmount <= 0) {
      return errorResponse("Vui lòng nhập số tiền thanh toán hợp lệ", 400);
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId: tenant.id,
      },
      include: {
        payments: true,
        room: true,
      },
    });

    if (!invoice) {
      return errorResponse("Không tìm thấy hóa đơn của bạn", 404);
    }

    const currentPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, invoice.total - currentPaid);

    if (remaining <= 0) {
      return errorResponse("Hóa đơn này đã được thanh toán đầy đủ", 400);
    }

    const payment = await prisma.$transaction(async (tx) => {
      // 1. Ghi nhận giao dịch
      const p = await tx.payment.create({
        data: {
          invoiceId,
          amount: payAmount,
          paymentMethod: paymentMethod === "CASH" ? "CASH" : "BANK_TRANSFER",
          paymentDate: new Date(),
          note: note?.trim() || (paymentMethod === "CASH" ? "Cư dân thanh toán tiền mặt" : "Cư dân chuyển khoản ngân hàng"),
        },
      });

      // 2. Tính lại tổng đã trả
      const allPayments = await tx.payment.findMany({
        where: { invoiceId },
      });
      const newTotalPaid = allPayments.reduce((sum, item) => sum + item.amount, 0);

      // 3. Cập nhật trạng thái hóa đơn
      const isPaid = newTotalPaid >= invoice.total;
      const isOverdue = !isPaid && invoice.dueDate < new Date();

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: isPaid ? "PAID" : isOverdue ? "OVERDUE" : "UNPAID",
        },
      });

      return p;
    });

    return successResponse(payment, "Ghi nhận thanh toán thành công", 201);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    return errorResponse("Lỗi khi xử lý thanh toán", 500);
  }
}

