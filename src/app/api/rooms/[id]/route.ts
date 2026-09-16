import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

interface Params {
  params: { id: string };
}

// GET /api/rooms/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        property: true,
        tenants: {
          include: {
            user: {
              select: { id: true, fullName: true, phone: true, email: true },
            },
          },
        },
        contracts: {
          orderBy: { createdAt: "desc" },
          include: {
            tenant: {
              include: { user: { select: { fullName: true, phone: true } } },
            },
          },
        },
        utilityReadings: {
          orderBy: { month: "desc" },
          take: 12,
        },
        roomServices: {
          include: { service: true },
        },
        invoices: {
          orderBy: { month: "desc" },
          take: 6,
        },
      },
    });

    if (!room) {
      return errorResponse("Không tìm thấy phòng", 404);
    }

    return successResponse(room);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tải thông tin phòng", 500);
  }
}

// PUT /api/rooms/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;
    const body = await req.json();

    const {
      propertyId,
      roomNumber,
      floor,
      area,
      rentPrice,
      electricPrice,
      waterPrice,
      deposit,
      maxOccupants,
      status,
      note,
      serviceIds,
    } = body;

    const existing = await prisma.room.findUnique({
      where: { id },
      include: {
        contracts: { where: { status: "ACTIVE" } },
      },
    });

    if (!existing) {
      return errorResponse("Không tìm thấy phòng", 404);
    }

    // Business check: if status changed to AVAILABLE but there is an active contract
    if (status === "AVAILABLE" && existing.contracts.length > 0) {
      return errorResponse(
        "Không thể đổi trạng thái phòng thành Trống khi vẫn còn hợp đồng thuê hiệu lực",
        400
      );
    }

    // Update room fields
    const updated = await prisma.room.update({
      where: { id },
      data: {
        ...(propertyId && { propertyId }),
        ...(roomNumber && { roomNumber: roomNumber.trim() }),
        ...(floor !== undefined && { floor: Number(floor) }),
        ...(area !== undefined && { area: Number(area) }),
        ...(rentPrice !== undefined && { rentPrice: Number(rentPrice) }),
        ...(electricPrice !== undefined && { electricPrice: Number(electricPrice) }),
        ...(waterPrice !== undefined && { waterPrice: Number(waterPrice) }),
        ...(deposit !== undefined && { deposit: Number(deposit) }),
        ...(maxOccupants !== undefined && { maxOccupants: Number(maxOccupants) }),
        ...(status && { status }),
        ...(note !== undefined && { note: note?.trim() || null }),
      },
    });

    // Update services if provided
    if (Array.isArray(serviceIds)) {
      await prisma.roomService.deleteMany({ where: { roomId: id } });
      if (serviceIds.length > 0) {
        await prisma.roomService.createMany({
          data: serviceIds.map((sId: string) => ({
            roomId: id,
            serviceId: sId,
            quantity: 1,
          })),
        });
      }
    }

    return successResponse(updated, "Cập nhật thông tin phòng thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi cập nhật phòng", 500);
  }
}

// DELETE /api/rooms/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        contracts: { where: { status: "ACTIVE" } },
        tenants: { where: { status: "ACTIVE" } },
      },
    });

    if (!room) {
      return errorResponse("Không tìm thấy phòng", 404);
    }

    if (room.contracts.length > 0 || room.tenants.length > 0) {
      return errorResponse(
        "Không thể xóa phòng đang có người thuê hoặc hợp đồng hiệu lực! Vui lòng kết thúc hợp đồng trước.",
        400
      );
    }

    await prisma.room.delete({ where: { id } });

    return successResponse(null, "Xóa phòng thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi xóa phòng", 500);
  }
}
