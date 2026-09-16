import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NotificationTargetType } from "@prisma/client";

// GET /api/notifications
// If Admin: returns all notifications
// If Tenant: returns notifications targeted to ALL, their PROPERTY, their ROOM, or their USER id
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.role === "ADMIN") {
      const notifications = await prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          reads: {
            include: { user: { select: { fullName: true } } },
          },
        },
      });
      return successResponse(notifications);
    }

    // Role is USER (Tenant)
    const tenant = await prisma.tenant.findUnique({
      where: { userId: session.userId },
      include: { room: true },
    });

    const targetConditions: any[] = [{ targetType: "ALL" }, { targetType: "USER", targetId: session.userId }];

    if (tenant?.room) {
      targetConditions.push({ targetType: "ROOM", targetId: tenant.room.id });
      targetConditions.push({ targetType: "PROPERTY", targetId: tenant.room.propertyId });
    }

    const notifications = await prisma.notification.findMany({
      where: { OR: targetConditions },
      orderBy: { createdAt: "desc" },
      include: {
        reads: {
          where: { userId: session.userId },
        },
      },
    });

    const enriched = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      targetType: n.targetType,
      createdAt: n.createdAt,
      isRead: n.reads.length > 0,
      readAt: n.reads[0]?.readAt || null,
    }));

    return successResponse(enriched);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    return errorResponse("Lỗi khi tải thông báo", 500);
  }
}

// POST /api/notifications - Admin sends notification
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { title, content, targetType = "ALL", targetId } = body;

    if (!title || !content) {
      return errorResponse("Vui lòng nhập tiêu đề và nội dung thông báo", 400);
    }

    const notif = await prisma.notification.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        targetType: targetType as NotificationTargetType,
        targetId: targetId || null,
      },
    });

    return successResponse(notif, "Gửi thông báo thành công", 201);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi gửi thông báo", 500);
  }
}
