import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { PaymentMethod } from "@prisma/client";

// GET /api/payments - list payments with pagination & filters
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const invoiceId = searchParams.get("invoiceId") || undefined;
    const paymentMethod = (searchParams.get("paymentMethod") as PaymentMethod) || undefined;
    const search = searchParams.get("search")?.trim();

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "20"));

    const where: any = {};
    if (invoiceId) where.invoiceId = invoiceId;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (search) {
      where.OR = [
        { invoice: { room: { roomNumber: { contains: search, mode: "insensitive" } } } },
        { invoice: { tenant: { user: { fullName: { contains: search, mode: "insensitive" } } } } },
        { note: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { paymentDate: "desc" },
        include: {
          invoice: {
            include: {
              room: {
                select: { id: true, roomNumber: true, property: { select: { name: true } } },
              },
              tenant: {
                include: { user: { select: { fullName: true, phone: true } } },
              },
            },
          },
        },
      }),
    ]);

    return successResponse({
      items: payments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tải danh sách thanh toán", 500);
  }
}

// POST /api/payments - record payment
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    const {
      invoiceId,
      amount,
      paymentMethod = "BANK_TRANSFER",
      paymentDate = new Date(),
      note,
    } = body;

    if (!invoiceId || !amount || Number(amount) <= 0) {
      return errorResponse("Vui lòng chọn hóa đơn và nhập số tiền thanh toán hợp lệ", 400);
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      return errorResponse("Không tìm thấy hóa đơn cần thanh toán", 404);
    }

    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create payment
      const p = await tx.payment.create({
        data: {
          invoiceId,
          amount: Number(amount),
          paymentMethod: paymentMethod as PaymentMethod,
          paymentDate: new Date(paymentDate),
          note: note?.trim() || null,
        },
      });

      // 2. Recalculate total paid
      const allPayments = await tx.payment.findMany({
        where: { invoiceId },
      });
      const totalPaid = allPayments.reduce((sum, item) => sum + item.amount, 0);

      // 3. Update invoice status
      const isPaid = totalPaid >= invoice.total;
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
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi ghi nhận thanh toán", 500);
  }
}
