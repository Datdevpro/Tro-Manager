import { prisma } from "@/lib/db/prisma";
import { calculateInvoiceTotal } from "@/lib/utils";
import { ensureAdditionalFeeTable } from "@/lib/db/ensure-additional-fee";

/**
 * Đồng bộ tổng tiền chi phí phát sinh của một phòng trong kỳ tháng vào Hóa Đơn (nếu có).
 * Nếu hóa đơn đã tồn tại và chưa thanh toán (UNPAID / OVERDUE), hệ thống sẽ cập nhật
 * lại otherFee và tính toán lại total một cách chính xác.
 */
export async function syncInvoiceWithAdditionalFees(roomId: string, month: string) {
  try {
    await ensureAdditionalFeeTable();

    // 1. Tính tổng chi phí phát sinh hiện có của phòng trong tháng
    let totalOtherFee = 0;
    try {
      const fees = await (prisma as any).additionalFee.findMany({
        where: { roomId, month },
      });
      totalOtherFee = fees.reduce((sum: number, f: any) => sum + f.amount, 0);
    } catch {
      totalOtherFee = 0;
    }

    // 2. Tìm hóa đơn của phòng trong tháng đó
    const invoice = await prisma.invoice.findFirst({
      where: { roomId, month },
    });

    if (!invoice) {
      // Hóa đơn tháng này chưa được tạo, khi nào tạo thì otherFee sẽ tự động được lấy
      return null;
    }

    // 3. Chỉ tự động cập nhật nếu hóa đơn chưa thanh toán hoặc quá hạn
    if (invoice.status === "UNPAID" || invoice.status === "OVERDUE") {
      if (invoice.otherFee !== totalOtherFee) {
        const newTotal = calculateInvoiceTotal({
          roomFee: invoice.roomFee,
          electricFee: invoice.electricFee,
          waterFee: invoice.waterFee,
          serviceFee: invoice.serviceFee,
          otherFee: totalOtherFee,
          previousDebt: invoice.previousDebt,
          discount: invoice.discount,
        });

        const updated = await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            otherFee: totalOtherFee,
            total: newTotal,
          },
        });

        return updated;
      }
    }

    return invoice;
  } catch (error) {
    console.error(`[SYNC_ADDITIONAL_FEES] Lỗi khi đồng bộ hóa đơn phòng ${roomId} tháng ${month}:`, error);
    return null;
  }
}

/**
 * Quét và đồng bộ tất cả hóa đơn của một tháng nếu có chi phí phát sinh chưa được cập nhật.
 */
export async function syncAllInvoicesForMonth(month?: string) {
  try {
    await ensureAdditionalFeeTable();

    const targetMonth = month || new Date().toISOString().slice(0, 7);

    // Lấy tất cả hóa đơn chưa thanh toán của tháng
    const invoices = await prisma.invoice.findMany({
      where: {
        month: targetMonth,
        status: { in: ["UNPAID", "OVERDUE"] },
      },
      select: {
        id: true,
        roomId: true,
        month: true,
        roomFee: true,
        electricFee: true,
        waterFee: true,
        serviceFee: true,
        otherFee: true,
        previousDebt: true,
        discount: true,
      },
    });

    for (const inv of invoices) {
      let fees: any[] = [];
      try {
        fees = await (prisma as any).additionalFee.findMany({
          where: { roomId: inv.roomId, month: inv.month },
        });
      } catch {
        fees = [];
      }

      const totalAdditional = fees.reduce((sum: number, f: any) => sum + f.amount, 0);

      if (inv.otherFee !== totalAdditional) {
        const newTotal = calculateInvoiceTotal({
          roomFee: inv.roomFee,
          electricFee: inv.electricFee,
          waterFee: inv.waterFee,
          serviceFee: inv.serviceFee,
          otherFee: totalAdditional,
          previousDebt: inv.previousDebt,
          discount: inv.discount,
        });

        await prisma.invoice.update({
          where: { id: inv.id },
          data: {
            otherFee: totalAdditional,
            total: newTotal,
          },
        });
      }
    }
  } catch (error) {
    console.error("[SYNC_ALL_INVOICES] Lỗi quét đồng bộ hóa đơn:", error);
  }
}
