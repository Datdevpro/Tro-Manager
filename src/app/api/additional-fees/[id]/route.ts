import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ensureAdditionalFeeTable } from "@/lib/db/ensure-additional-fee";
import { syncInvoiceWithAdditionalFees } from "@/lib/services/additional-fee-sync";

interface Params {
  params: { id: string };
}

// PUT /api/additional-fees/[id] - Update incidental fee
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    await ensureAdditionalFeeTable();
    const { id } = params;
    const body = await req.json();
    const { roomId, month, title, amount, description, date } = body;

    const existing = await (prisma as any).additionalFee.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Không tìm thấy khoản phát sinh", 404);
    }

    const updateData: any = {};
    if (roomId) updateData.roomId = roomId;
    if (month) updateData.month = month;
    if (title) updateData.title = title.trim();
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) return errorResponse("Số tiền không hợp lệ", 400);
      updateData.amount = numAmount;
    }
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (date) updateData.date = new Date(date);

    const updated = await (prisma as any).additionalFee.update({
      where: { id },
      data: updateData,
    });

    // Đồng bộ hóa đơn phòng & kỳ tháng hiện tại
    await syncInvoiceWithAdditionalFees(updated.roomId, updated.month);
    // Nếu chuyển phòng hoặc chuyển kỳ tháng, đồng bộ cả phòng & kỳ tháng cũ
    if (existing.roomId !== updated.roomId || existing.month !== updated.month) {
      await syncInvoiceWithAdditionalFees(existing.roomId, existing.month);
    }

    return successResponse(updated, "Cập nhật chi phí phát sinh thành công");
  } catch (error: any) {
    console.error("Lỗi PUT /api/additional-fees/[id]:", error);
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse(`Lỗi khi cập nhật khoản phát sinh: ${error.message || ""}`, 500);
  }
}

// DELETE /api/additional-fees/[id] - Delete incidental fee
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    await ensureAdditionalFeeTable();
    const { id } = params;

    const existing = await (prisma as any).additionalFee.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Không tìm thấy khoản phát sinh", 404);
    }

    await (prisma as any).additionalFee.delete({
      where: { id },
    });

    // Đồng bộ lại hóa đơn của phòng sau khi xóa khoản phát sinh
    await syncInvoiceWithAdditionalFees(existing.roomId, existing.month);

    return successResponse(null, "Đã xóa khoản phát sinh");
  } catch (error: any) {
    console.error("Lỗi DELETE /api/additional-fees/[id]:", error);
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse(`Lỗi khi xóa khoản phát sinh: ${error.message || ""}`, 500);
  }
}

