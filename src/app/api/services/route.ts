import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ServiceCalculationType } from "@prisma/client";

// GET /api/services - list all services
export async function GET() {
  try {
    await requireAdmin();
    const services = await prisma.service.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { roomServices: true } },
      },
    });
    return successResponse(services);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tải danh sách dịch vụ", 500);
  }
}

// POST /api/services - create new service
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { name, price, calculationType = "FIXED", description } = body;

    if (!name || price === undefined) {
      return errorResponse("Vui lòng nhập tên dịch vụ và đơn giá", 400);
    }

    if (price < 0) {
      return errorResponse("Đơn giá dịch vụ không được âm", 400);
    }

    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        price: Number(price),
        calculationType: calculationType as ServiceCalculationType,
        description: description?.trim() || null,
      },
    });

    return successResponse(service, "Tạo dịch vụ thành công", 201);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tạo dịch vụ", 500);
  }
}
