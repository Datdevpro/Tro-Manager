import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { calculateInvoiceTotal } from "@/lib/utils";

interface Params {
  params: { id: string };
}

// GET /api/invoices/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            user: { select: { fullName: true, phone: true, email: true } },
          },
        },
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

    const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = Math.max(0, invoice.total - paidAmount);

    let additionalFees: any[] = [];
    try {
      additionalFees = await (prisma as any).additionalFee.findMany({
        where: { roomId: invoice.roomId, month: invoice.month },
        orderBy: { date: "desc" },
      });
    } catch {
      additionalFees = [];
    }

    return successResponse({
      ...invoice,
      paidAmount,
      remainingAmount,
      additionalFees,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tải thông tin hóa đơn", 500);
  }
}

// PUT /api/invoices/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;
    const body = await req.json();

    const {
      roomFee,
      electricFee,
      waterFee,
      serviceFee,
      otherFee,
      previousDebt,
      discount,
      dueDate,
      status,
    } = body;

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) return errorResponse("Không tìm thấy hóa đơn", 404);

    const rFee = roomFee !== undefined ? Number(roomFee) : existing.roomFee;
    const eFee = electricFee !== undefined ? Number(electricFee) : existing.electricFee;
    const wFee = waterFee !== undefined ? Number(waterFee) : existing.waterFee;
    const sFee = serviceFee !== undefined ? Number(serviceFee) : existing.serviceFee;
    const oFee = otherFee !== undefined ? Number(otherFee) : existing.otherFee;
    const pDebt = previousDebt !== undefined ? Number(previousDebt) : existing.previousDebt;
    const disc = discount !== undefined ? Number(discount) : existing.discount;

    const total = calculateInvoiceTotal({
      roomFee: rFee,
      electricFee: eFee,
      waterFee: wFee,
      serviceFee: sFee,
      otherFee: oFee,
      previousDebt: pDebt,
      discount: disc,
    });

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        roomFee: rFee,
        electricFee: eFee,
        waterFee: wFee,
        serviceFee: sFee,
        otherFee: oFee,
        previousDebt: pDebt,
        discount: disc,
        total,
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(status && { status }),
      },
    });

    return successResponse(updated, "Cập nhật hóa đơn thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi cập nhật hóa đơn", 500);
  }
}

// DELETE /api/invoices/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) return errorResponse("Không tìm thấy hóa đơn", 404);

    await prisma.invoice.delete({ where: { id } });
    return successResponse(null, "Xóa hóa đơn thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi xóa hóa đơn", 500);
  }
}
