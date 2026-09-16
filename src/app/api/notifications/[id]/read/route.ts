import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = params;

    const notif = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notif) return errorResponse("Thông báo không tồn tại", 404);

    const read = await prisma.notificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId: id,
          userId: session.userId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        notificationId: id,
        userId: session.userId,
        readAt: new Date(),
      },
    });

    return successResponse(read, "Đã đánh dấu đã đọc");
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    return errorResponse("Lỗi xử lý", 500);
  }
}
