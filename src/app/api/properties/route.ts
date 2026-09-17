import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

// GET /api/properties - list all properties with summary counts
export async function GET() {
  try {
    await requireAdmin();

    const properties = await prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        rooms: {
          select: {
            id: true,
            status: true,
            tenants: {
              select: { id: true },
            },
          },
        },
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    const summary = properties.map((prop) => {
      const totalRooms = prop.rooms.length;
      const occupiedRooms = prop.rooms.filter((r) => r.status === "OCCUPIED").length;
      const availableRooms = prop.rooms.filter((r) => r.status === "AVAILABLE").length;
      const maintenanceRooms = prop.rooms.filter((r) => r.status === "MAINTENANCE").length;
      const totalTenants = prop.rooms.reduce(
        (acc, curr) => acc + (curr.tenants ? curr.tenants.length : 0),
        0
      );

      return {
        id: prop.id,
        name: prop.name,
        address: prop.address,
        description: prop.description,
        electricPrice: prop.electricPrice,
        waterPrice: prop.waterPrice,
        servicesCount: prop._count?.services || 0,
        createdAt: prop.createdAt,
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        totalTenants,
      };
    });

    return successResponse(summary);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tải danh sách khu trọ", 500);
  }
}

// POST /api/properties - create property
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { name, address, description, electricPrice = 3500, waterPrice = 25000 } = body;

    if (!name || !address) {
      return errorResponse("Vui lòng nhập tên khu trọ và địa chỉ", 400);
    }

    const numElectricPrice = Number(electricPrice);
    const numWaterPrice = Number(waterPrice);

    if (numElectricPrice < 0 || numWaterPrice < 0) {
      return errorResponse("Đơn giá điện và nước không được âm", 400);
    }

    const property = await prisma.property.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        description: description?.trim() || null,
        electricPrice: numElectricPrice,
        waterPrice: numWaterPrice,
      },
    });

    return successResponse(property, "Thêm khu trọ thành công", 201);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tạo khu trọ", 500);
  }
}
