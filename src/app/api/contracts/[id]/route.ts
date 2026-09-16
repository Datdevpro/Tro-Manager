import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

interface Params {
  params: { id: string };
}

// GET /api/contracts/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            user: true,
          },
        },
        room: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!contract) {
      return errorResponse("Không tìm thấy hợp đồng", 404);
    }

    return successResponse(contract);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tải thông tin hợp đồng", 500);
  }
}

// PUT /api/contracts/[id] - edit, renew, terminate
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;
    const body = await req.json();

    const {
      startDate,
      endDate,
      rentPrice,
      deposit,
      paymentCycle,
      terms,
      status,
    } = body;

    const existing = await prisma.contract.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Không tìm thấy hợp đồng", 404);
    }

    const roomId = existing.roomId;

    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.contract.update({
        where: { id },
        data: {
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(rentPrice !== undefined && { rentPrice: Number(rentPrice) }),
          ...(deposit !== undefined && { deposit: Number(deposit) }),
          ...(paymentCycle !== undefined && { paymentCycle: Number(paymentCycle) }),
          ...(terms !== undefined && { terms: terms?.trim() || null }),
          ...(status && { status }),
        },
        include: {
          tenant: { include: { user: true } },
          room: true,
        },
      });

      // If terminated or expired, check if any other active contracts remain for this room
      if (status === "TERMINATED" || status === "EXPIRED") {
        const otherActive = await tx.contract.count({
          where: { roomId, status: "ACTIVE", NOT: { id } },
        });

        if (otherActive === 0) {
          await tx.room.update({
            where: { id: roomId },
            data: { status: "AVAILABLE" },
          });
        }
      } else if (status === "ACTIVE") {
        await tx.room.update({
          where: { id: roomId },
          data: { status: "OCCUPIED" },
        });
      }

      return c;
    });

    return successResponse(updated, "Cập nhật hợp đồng thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi cập nhật hợp đồng", 500);
  }
}

// DELETE /api/contracts/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;

    const contract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      return errorResponse("Không tìm thấy hợp đồng", 404);
    }

    const roomId = contract.roomId;

    await prisma.$transaction(async (tx) => {
      await tx.contract.delete({ where: { id } });

      const otherActive = await tx.contract.count({
        where: { roomId, status: "ACTIVE" },
      });

      if (otherActive === 0) {
        await tx.room.update({
          where: { id: roomId },
          data: { status: "AVAILABLE" },
        });
      }
    });

    return successResponse(null, "Xóa hợp đồng thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi xóa hợp đồng", 500);
  }
}
