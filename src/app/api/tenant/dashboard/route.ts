import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requireAuth();

    const tenant = await prisma.tenant.findUnique({
      where: { userId: session.userId },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
        room: {
          include: {
            property: true,
            roomServices: { include: { service: true } },
          },
        },
        contracts: {
          where: { status: "ACTIVE" },
          take: 1,
        },
        invoices: {
          orderBy: [{ month: "desc" }, { createdAt: "desc" }],
          take: 1,
          include: { payments: true },
        },
      },
    });

    if (!tenant) {
      return errorResponse("Không tìm thấy thông tin cư dân liên kết với tài khoản này", 404);
    }

    // Recent notifications for this tenant
    const targetConditions: any[] = [
      { targetType: "ALL" },
      { targetType: "USER", targetId: session.userId },
    ];
    if (tenant.room) {
      targetConditions.push({ targetType: "ROOM", targetId: tenant.room.id });
      targetConditions.push({ targetType: "PROPERTY", targetId: tenant.room.propertyId });
    }

    const notifications = await prisma.notification.findMany({
      where: { OR: targetConditions },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        reads: { where: { userId: session.userId } },
      },
    });

    const enrichedNotifs = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      createdAt: n.createdAt,
      isRead: n.reads.length > 0,
    }));

    // Current invoice calculation
    const currentInvoice = tenant.invoices[0] || null;
    let enrichedInvoice = null;
    if (currentInvoice) {
      const paid = currentInvoice.payments.reduce((sum, p) => sum + p.amount, 0);
      enrichedInvoice = {
        ...currentInvoice,
        paidAmount: paid,
        remainingAmount: Math.max(0, currentInvoice.total - paid),
      };
    }

    return successResponse({
      tenant: {
        id: tenant.id,
        idNumber: tenant.idNumber,
        birthday: tenant.birthday,
        gender: tenant.gender,
        permanentAddress: tenant.permanentAddress,
        startDate: tenant.startDate,
        user: tenant.user,
      },
      currentRoom: tenant.room,
      currentContract: tenant.contracts[0] || null,
      currentInvoice: enrichedInvoice,
      recentNotifications: enrichedNotifs,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    return errorResponse("Lỗi khi tải trang cư dân", 500);
  }
}
