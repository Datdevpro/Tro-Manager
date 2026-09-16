import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET /api/tenant/contract - view contract
export async function GET() {
  try {
    const session = await requireAuth();

    const tenant = await prisma.tenant.findUnique({
      where: { userId: session.userId },
    });

    if (!tenant) {
      return errorResponse("Không tìm thấy thông tin cư dân", 404);
    }

    const contracts = await prisma.contract.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      include: {
        room: {
          include: {
            property: true,
          },
        },
      },
    });

    return successResponse(contracts);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    return errorResponse("Lỗi khi tải hợp đồng", 500);
  }
}
