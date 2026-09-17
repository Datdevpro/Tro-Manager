import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

interface Params {
  params: { id: string };
}

// PUT /api/services/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;
    const body = await req.json();
    const { name, price, calculationType, description, propertyId } = body;

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return errorResponse("Không tìm thấy dịch vụ", 404);

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(price !== undefined && { price: Number(price) }),
        ...(calculationType && { calculationType }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(propertyId !== undefined && { propertyId: propertyId ? String(propertyId) : null }),
      },
      include: {
        property: {
          select: { id: true, name: true },
        },
        _count: { select: { roomServices: true } },
      },
    });

    return successResponse(updated, "Cập nhật dịch vụ thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi cập nhật dịch vụ", 500);
  }
}

// DELETE /api/services/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = params;

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return errorResponse("Không tìm thấy dịch vụ", 404);

    await prisma.service.delete({ where: { id } });
    return successResponse(null, "Xóa dịch vụ thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi xóa dịch vụ", 500);
  }
}
