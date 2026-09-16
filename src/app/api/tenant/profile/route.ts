import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET /api/tenant/profile
export async function GET() {
  try {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        tenant: {
          include: {
            room: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!user) return errorResponse("Người dùng không tồn tại", 404);

    return successResponse(user);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    return errorResponse("Lỗi tải thông tin cá nhân", 500);
  }
}

// PUT /api/tenant/profile
// Strictly permits only fullName, phone, avatarUrl
export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const { fullName, phone, avatarUrl } = body;

    if (!fullName || !fullName.trim()) {
      return errorResponse("Họ và tên không được để trống", 400);
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        fullName: fullName.trim(),
        phone: phone !== undefined ? phone?.trim() || null : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl?.trim() || null : undefined,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    });

    return successResponse(updated, "Cập nhật hồ sơ thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    return errorResponse("Lỗi cập nhật hồ sơ", 500);
  }
}
