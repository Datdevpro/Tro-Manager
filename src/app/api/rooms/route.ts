import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { RoomStatus } from "@prisma/client";

// GET /api/rooms - filterable, searchable, paginated
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const propertyId = searchParams.get("propertyId") || undefined;
    const status = (searchParams.get("status") as RoomStatus) || undefined;
    const floor = searchParams.get("floor") ? parseInt(searchParams.get("floor")!) : undefined;
    const search = searchParams.get("search")?.trim() || undefined;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "20"));

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;
    if (floor) where.floor = floor;
    if (search) {
      where.roomNumber = { contains: search, mode: "insensitive" };
    }

    const [total, rooms] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
        include: {
          property: {
            select: { id: true, name: true, address: true },
          },
          tenants: {
            where: { status: "ACTIVE" },
            include: {
              user: {
                select: { id: true, fullName: true, phone: true, email: true },
              },
            },
          },
          contracts: {
            where: { status: "ACTIVE" },
            take: 1,
          },
          roomServices: {
            include: {
              service: true,
            },
          },
        },
      }),
    ]);

    return successResponse({
      items: rooms,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tải danh sách phòng", 500);
  }
}

// POST /api/rooms - create room
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    const {
      propertyId,
      roomNumber,
      floor = 1,
      area = 20,
      rentPrice,
      electricPrice,
      waterPrice,
      deposit = 0,
      maxOccupants = 2,
      status = "AVAILABLE",
      note,
      serviceIds = [],
    } = body;

    if (!propertyId || !roomNumber || rentPrice === undefined) {
      return errorResponse("Vui lòng cung cấp khu trọ, số phòng và giá thuê", 400);
    }

    // Lookup property to inherit default electric & water price if not passed
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, electricPrice: true, waterPrice: true },
    });

    if (!property) {
      return errorResponse("Không tìm thấy khu trọ được chọn", 404);
    }

    const finalElectricPrice = electricPrice !== undefined ? Number(electricPrice) : property.electricPrice;
    const finalWaterPrice = waterPrice !== undefined ? Number(waterPrice) : property.waterPrice;

    if (rentPrice < 0 || finalElectricPrice < 0 || finalWaterPrice < 0 || deposit < 0) {
      return errorResponse("Đơn giá không được âm", 400);
    }

    // Check if roomNumber already exists in the same property
    const existing = await prisma.room.findFirst({
      where: {
        propertyId,
        roomNumber: roomNumber.trim(),
      },
    });

    if (existing) {
      return errorResponse(`Phòng ${roomNumber} đã tồn tại trong khu trọ này`, 400);
    }

    const room = await prisma.room.create({
      data: {
        propertyId,
        roomNumber: roomNumber.trim(),
        floor: Number(floor),
        area: Number(area),
        rentPrice: Number(rentPrice),
        electricPrice: finalElectricPrice,
        waterPrice: finalWaterPrice,
        deposit: Number(deposit),
        maxOccupants: Number(maxOccupants),
        status,
        note: note?.trim() || null,
        roomServices: {
          create: serviceIds.map((sId: string) => ({
            serviceId: sId,
            quantity: 1,
          })),
        },
      },
      include: {
        property: true,
        roomServices: { include: { service: true } },
      },
    });

    return successResponse(room, "Thêm phòng mới thành công", 201);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tạo phòng", 500);
  }
}
