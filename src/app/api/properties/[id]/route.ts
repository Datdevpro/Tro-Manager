import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

interface Params {
  params: { id: string };
}

// GET /api/properties/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        services: true,
        rooms: {
          include: {
            tenants: {
              include: {
                user: {
                  select: { id: true, fullName: true, phone: true, email: true },
                },
              },
            },
            contracts: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });

    if (!property) {
      return errorResponse("Không tìm thấy khu trọ", 404);
    }

    return successResponse(property);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tải thông tin khu trọ", 500);
  }
}

// PUT /api/properties/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;
    const body = await req.json();
    const { name, address, description, electricPrice, waterPrice, syncRooms } = body;

    if (!name || !address) {
      return errorResponse("Tên khu trọ và địa chỉ không được để trống", 400);
    }

    const updateData: any = {
      name: name.trim(),
      address: address.trim(),
      description: description?.trim() || null,
    };

    if (electricPrice !== undefined) {
      const numElectricPrice = Number(electricPrice);
      if (numElectricPrice < 0) return errorResponse("Giá điện không được âm", 400);
      updateData.electricPrice = numElectricPrice;
    }

    if (waterPrice !== undefined) {
      const numWaterPrice = Number(waterPrice);
      if (numWaterPrice < 0) return errorResponse("Giá nước không được âm", 400);
      updateData.waterPrice = numWaterPrice;
    }

    const updated = await prisma.property.update({
      where: { id },
      data: updateData,
    });

    // If syncRooms is true, cascade the new electric and water prices to all rooms in this property
    if (syncRooms && (updateData.electricPrice !== undefined || updateData.waterPrice !== undefined)) {
      const roomRateUpdates: any = {};
      if (updateData.electricPrice !== undefined) roomRateUpdates.electricPrice = updateData.electricPrice;
      if (updateData.waterPrice !== undefined) roomRateUpdates.waterPrice = updateData.waterPrice;

      await prisma.room.updateMany({
        where: { propertyId: id },
        data: roomRateUpdates,
      });
    }

    return successResponse(updated, "Cập nhật khu trọ thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi cập nhật khu trọ", 500);
  }
}

// DELETE /api/properties/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;

    // Check if property has rooms with active contracts
    const activeContracts = await prisma.contract.count({
      where: {
        room: { propertyId: id },
        status: "ACTIVE",
      },
    });

    if (activeContracts > 0) {
      return errorResponse(
        `Không thể xóa khu trọ đang có ${activeContracts} hợp đồng thuê phòng hiệu lực! Vui lòng thanh lý hợp đồng trước.`,
        400
      );
    }

    await prisma.property.delete({
      where: { id },
    });

    return successResponse(null, "Xóa khu trọ thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi xóa khu trọ", 500);
  }
}
