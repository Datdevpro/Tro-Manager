import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

interface Params {
  params: { id: string };
}

// GET /api/tenants/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        room: {
          include: {
            property: true,
          },
        },
        contracts: {
          orderBy: { createdAt: "desc" },
          include: { room: true },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          include: { payments: true, room: true },
        },
      },
    });

    if (!tenant) {
      return errorResponse("Không tìm thấy khách thuê", 404);
    }

    return successResponse(tenant);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tải thông tin khách thuê", 500);
  }
}

// PUT /api/tenants/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;
    const body = await req.json();

    const {
      fullName,
      phone,
      idNumber,
      birthday,
      gender,
      permanentAddress,
      roomId,
      status,
    } = body;

    const existing = await prisma.tenant.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!existing) {
      return errorResponse("Không tìm thấy khách thuê", 404);
    }

    const oldRoomId = existing.roomId;
    const newRoomId = roomId !== undefined ? (roomId || null) : oldRoomId;

    const updated = await prisma.$transaction(async (tx) => {
      // Update User table
      if (fullName || phone !== undefined) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(fullName && { fullName: fullName.trim() }),
            ...(phone !== undefined && { phone: phone?.trim() || null }),
          },
        });
      }

      // Update Tenant table
      const t = await tx.tenant.update({
        where: { id },
        data: {
          ...(idNumber !== undefined && { idNumber: idNumber?.trim() }),
          ...(birthday !== undefined && { birthday: birthday ? new Date(birthday) : null }),
          ...(gender !== undefined && { gender }),
          ...(permanentAddress !== undefined && { permanentAddress: permanentAddress?.trim() }),
          ...(roomId !== undefined && { roomId: newRoomId }),
          ...(status && { status }),
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              avatarUrl: true,
            },
          },
          room: true,
        },
      });

      // Handle room movement: if old room has no other active tenants, set to AVAILABLE
      if (oldRoomId && oldRoomId !== newRoomId) {
        const remainingTenants = await tx.tenant.count({
          where: { roomId: oldRoomId, status: "ACTIVE", NOT: { id } },
        });
        if (remainingTenants === 0) {
          await tx.room.update({
            where: { id: oldRoomId },
            data: { status: "AVAILABLE" },
          });
        }
      }

      // If new room is set and tenant is ACTIVE, set room to OCCUPIED
      if (newRoomId && t.status === "ACTIVE") {
        await tx.room.update({
          where: { id: newRoomId },
          data: { status: "OCCUPIED" },
        });
      }

      return t;
    });

    return successResponse(updated, "Cập nhật hồ sơ người thuê thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi cập nhật hồ sơ người thuê", 500);
  }
}

// DELETE /api/tenants/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        contracts: { where: { status: "ACTIVE" } },
        invoices: { where: { status: { in: ["UNPAID", "OVERDUE"] } } },
      },
    });

    if (!tenant) {
      return errorResponse("Không tìm thấy người thuê", 404);
    }

    if (tenant.contracts.length > 0) {
      return errorResponse("Không thể xóa người thuê đang có hợp đồng hoạt động!", 400);
    }

    if (tenant.invoices.length > 0) {
      return errorResponse("Không thể xóa người thuê còn hóa đơn chưa thanh toán!", 400);
    }

    const roomId = tenant.roomId;

    await prisma.$transaction(async (tx) => {
      await tx.tenant.delete({ where: { id } });
      await tx.user.delete({ where: { id: tenant.userId } });

      if (roomId) {
        const remaining = await tx.tenant.count({
          where: { roomId, status: "ACTIVE" },
        });
        if (remaining === 0) {
          await tx.room.update({
            where: { id: roomId },
            data: { status: "AVAILABLE" },
          });
        }
      }
    });

    return successResponse(null, "Xóa hồ sơ người thuê thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi xóa người thuê", 500);
  }
}
