import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { calculateInvoiceTotal } from "@/lib/utils";
import { ensureAdditionalFeeTable } from "@/lib/db/ensure-additional-fee";

// POST /api/invoices/generate-bulk - generate monthly invoices for all occupied rooms
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureAdditionalFeeTable();
    const body = await req.json();
    const { month, dueDate } = body;

    if (!month || !dueDate) {
      return errorResponse("Vui lòng chọn tháng xuất hóa đơn và hạn thanh toán", 400);
    }

    const due = new Date(dueDate);

    // 1. Find all active contracts
    const activeContracts = await prisma.contract.findMany({
      where: { status: "ACTIVE" },
      include: {
        room: {
          include: {
            roomServices: {
              include: { service: true },
            },
          },
        },
        tenant: true,
      },
    });

    if (activeContracts.length === 0) {
      return errorResponse("Không có hợp đồng thuê nào đang có hiệu lực", 400);
    }

    let generatedCount = 0;
    let skippedCount = 0;

    for (const contract of activeContracts) {
      const { room, tenant } = contract;

      // Check if invoice for this room and month already exists
      const existing = await prisma.invoice.findFirst({
        where: {
          roomId: room.id,
          month,
        },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // 2. Room Fee
      const roomFee = contract.rentPrice;

      // 3. Utility reading
      const reading = await prisma.utilityReading.findUnique({
        where: { roomId_month: { roomId: room.id, month } },
      });

      let electricFee = 0;
      let waterFee = 0;

      if (reading) {
        const eUsage = Math.max(0, reading.electricNew - reading.electricOld);
        const wUsage = Math.max(0, reading.waterNew - reading.waterOld);
        electricFee = eUsage * room.electricPrice;
        waterFee = wUsage * room.waterPrice;
      }

      // 4. Services Fee
      let serviceFee = 0;
      for (const rs of room.roomServices) {
        const s = rs.service;
        if (s.calculationType === "QUANTITY") {
          serviceFee += s.price * rs.quantity;
        } else {
          serviceFee += s.price;
        }
      }

      // 5. Additional / Incidental Fees (Chi phí phát sinh của phòng trong tháng)
      let otherFee = 0;
      try {
        const fees = await (prisma as any).additionalFee.findMany({
          where: { roomId: room.id, month },
        });
        otherFee = fees.reduce((sum: number, f: any) => sum + f.amount, 0);
      } catch {
        otherFee = 0;
      }

      // 6. Total
      const total = calculateInvoiceTotal({
        roomFee,
        electricFee,
        waterFee,
        serviceFee,
        otherFee,
        previousDebt: 0,
        discount: 0,
      });

      await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          roomId: room.id,
          month,
          roomFee,
          electricFee,
          waterFee,
          serviceFee,
          otherFee,
          previousDebt: 0,
          discount: 0,
          total,
          dueDate: due,
          status: "UNPAID",
        },
      });

      generatedCount++;
    }

    return successResponse(
      { generatedCount, skippedCount },
      `Đã phát hành thành công ${generatedCount} hóa đơn cho kỳ ${month} (Bỏ qua ${skippedCount} hóa đơn đã tạo trước đó).`
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tự động phát hành hóa đơn hàng loạt", 500);
  }
}
