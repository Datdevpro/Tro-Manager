import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return errorResponse("Vui lòng điền mật khẩu hiện tại và mật khẩu mới", 400);
    }

    if (newPassword.length < 6) {
      return errorResponse("Mật khẩu mới phải có ít nhất 6 ký tự", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return errorResponse("Người dùng không tồn tại", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return errorResponse("Mật khẩu hiện tại không chính xác", 400);
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return successResponse(null, "Đổi mật khẩu thành công");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return errorResponse("Vui lòng đăng nhập", 401);
    }
    return errorResponse("Lỗi đổi mật khẩu", 500);
  }
}
