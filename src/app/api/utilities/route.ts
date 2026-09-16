import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET /api/utilities
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const month = searchParams.get("month") || undefined;
    const propertyId = searchParams.get("propertyId") || undefined;
    const roomId = searchParams.get("roomId") || undefined;

    const where: any = {};
    if (month) where.month = month;
    if (roomId) where.roomId = roomId;
    if (propertyId) {
      where.room = { propertyId };
    }

    const readings = await prisma.utilityReading.findMany({
      where,
      orderBy: [{ month: "desc" }, { room: { roomNumber: "asc" } }],
      include: {
        room: {
          include: {
            property: { select: { id: true, name: true } },
            tenants: {
              where: { status: "ACTIVE" },
              include: { user: { select: { fullName: true } } },
            },
          },
        },
      },
    });

    const enriched = readings.map((r) => {
      const electricUsage = Math.max(0, r.electricNew - r.electricOld);
      const electricCost = electricUsage * r.room.electricPrice;
      const waterUsage = Math.max(0, r.waterNew - r.waterOld);
      const waterCost = waterUsage * r.room.waterPrice;
      const totalUtilityCost = electricCost + waterCost;

      return {
        ...r,
        electricUsage,
        electricCost,
        waterUsage,
        waterCost,
        totalUtilityCost,
      };
    });

    return successResponse(enriched);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tải chỉ số điện nước", 500);
  }
}

// POST /api/utilities - record or update readings for room in a month
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    const {
      roomId,
      month,
      electricOld = 0,
      electricNew = 0,
      waterOld = 0,
      waterNew = 0,
    } = body;

    if (!roomId || !month) {
      return errorResponse("Vui lòng chọn phòng và tháng ghi chỉ số", 400);
    }

    const eOld = Number(electricOld);
    const eNew = Number(electricNew);
    const wOld = Number(waterOld);
    const wNew = Number(waterNew);

    if (eNew < eOld) {
      return errorResponse(
        `Chỉ số điện mới (${eNew}) không được nhỏ hơn chỉ số điện cũ (${eOld})`,
        400
      );
    }

    if (wNew < wOld) {
      return errorResponse(
        `Chỉ số nước mới (${wNew}) không được nhỏ hơn chỉ số nước cũ (${wOld})`,
        400
      );
    }

    // Upsert reading
    const reading = await prisma.utilityReading.upsert({
      where: {
        roomId_month: { roomId, month },
      },
      update: {
        electricOld: eOld,
        electricNew: eNew,
        waterOld: wOld,
        waterNew: wNew,
      },
      create: {
        roomId,
        month,
        electricOld: eOld,
        electricNew: eNew,
        waterOld: wOld,
        waterNew: wNew,
      },
      include: {
        room: true,
      },
    });

    const electricUsage = eNew - eOld;
    const waterUsage = wNew - wOld;
    const electricCost = electricUsage * reading.room.electricPrice;
    const waterCost = waterUsage * reading.room.waterPrice;

    return successResponse(
      {
        ...reading,
        electricUsage,
        waterUsage,
        electricCost,
        waterCost,
      },
      "Cập nhật chỉ số điện nước thành công"
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi ghi nhận chỉ số điện nước", 500);
  }
}
