import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ensureAdditionalFeeTable } from "@/lib/db/ensure-additional-fee";
import { syncInvoiceWithAdditionalFees } from "@/lib/services/additional-fee-sync";

// GET /api/additional-fees - List incidental costs with filters
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureAdditionalFeeTable();

    const { searchParams } = new URL(req.url);

    const month = searchParams.get("month") || undefined;
    const roomId = searchParams.get("roomId") || undefined;
    const propertyId = searchParams.get("propertyId") || undefined;
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (month) where.month = month;
    if (roomId) where.roomId = roomId;
    if (propertyId) {
      where.room = { propertyId };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { room: { roomNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    let fees = [];
    try {
      fees = await (prisma as any).additionalFee.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: {
          room: {
            select: {
              id: true,
              roomNumber: true,
              property: { select: { id: true, name: true } },
            },
          },
        },
      });
    } catch (dbErr: any) {
      console.warn("Retrying after ensureAdditionalFeeTable due to:", dbErr?.message);
      await ensureAdditionalFeeTable();
      fees = await (prisma as any).additionalFee.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: {
          room: {
            select: {
              id: true,
              roomNumber: true,
              property: { select: { id: true, name: true } },
            },
          },
        },
      }).catch(() => []);
    }

    const totalAmount = fees.reduce((sum: number, f: any) => sum + f.amount, 0);

    return successResponse({
      items: fees,
      totalAmount,
      count: fees.length,
    });
  } catch (error: any) {
    console.error("Lỗi GET /api/additional-fees:", error);
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse(`Lỗi khi tải danh sách chi phí phát sinh: ${error.message || ""}`, 500);
  }
}

// POST /api/additional-fees - Record a new incidental fee
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureAdditionalFeeTable();

    const body = await req.json();
    const { roomId, month, title, amount, description, date } = body;

    const numAmount = Number(amount);
    if (!roomId || !month || !title?.trim() || isNaN(numAmount) || numAmount <= 0) {
      return errorResponse("Vui lòng chọn phòng, kỳ tháng, tên khoản phát sinh và số tiền hợp lệ", 400);
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return errorResponse("Không tìm thấy phòng trọ", 404);
    }

    let parsedDate = new Date();
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    let fee;
    try {
      fee = await (prisma as any).additionalFee.create({
        data: {
          roomId,
          month,
          title: title.trim(),
          amount: numAmount,
          description: description?.trim() || null,
          date: parsedDate,
        },
        include: {
          room: {
            select: {
              id: true,
              roomNumber: true,
              property: { select: { id: true, name: true } },
            },
          },
        },
      });
    } catch (createErr: any) {
      console.warn("Retrying POST after ensureAdditionalFeeTable due to:", createErr?.message);
      await ensureAdditionalFeeTable();
      fee = await (prisma as any).additionalFee.create({
        data: {
          roomId,
          month,
          title: title.trim(),
          amount: numAmount,
          description: description?.trim() || null,
          date: parsedDate,
        },
        include: {
          room: {
            select: {
              id: true,
              roomNumber: true,
              property: { select: { id: true, name: true } },
            },
          },
        },
      });
    }

    // Tự động đồng bộ ngay vào hóa đơn tháng này của phòng nếu đã có hóa đơn
    await syncInvoiceWithAdditionalFees(roomId, month);

    return successResponse(fee, "Ghi nhận chi phí phát sinh thành công", 201);
  } catch (error: any) {
    console.error("Lỗi POST /api/additional-fees:", error);
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse(`Lỗi khi ghi nhận chi phí phát sinh: ${error.message || ""}`, 500);
  }
}

