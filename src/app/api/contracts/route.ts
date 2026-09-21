import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ContractStatus } from "@prisma/client";

// GET /api/contracts
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") as ContractStatus) || undefined;
    const roomId = searchParams.get("roomId") || undefined;
    const tenantId = searchParams.get("tenantId") || undefined;
    const search = searchParams.get("search")?.trim();

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "20"));

    const where: any = {};
    if (status) where.status = status;
    if (roomId) where.roomId = roomId;
    if (tenantId) where.tenantId = tenantId;
    if (search) {
      where.OR = [
        { tenant: { user: { fullName: { contains: search, mode: "insensitive" } } } },
        { room: { roomNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, contracts] = await Promise.all([
      prisma.contract.count({ where }),
      prisma.contract.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          tenant: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true, phone: true },
              },
            },
          },
          room: {
            include: {
              property: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return successResponse({
      items: contracts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error("[GET /api/contracts error]:", error);
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse(error?.message || "Lỗi khi tải danh sách hợp đồng", 500);
  }
}

// POST /api/contracts - create new contract
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    const {
      tenantId,
      roomId,
      startDate,
      endDate,
      rentPrice,
      deposit = 0,
      paymentCycle = 1,
      terms,
      status = "ACTIVE",
    } = body;

    if (!tenantId || !roomId || !startDate || !endDate || rentPrice === undefined) {
      return errorResponse("Vui lòng nhập đầy đủ thông tin hợp đồng", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return errorResponse("Ngày kết thúc hợp đồng phải sau ngày bắt đầu", 400);
    }

    // Check if tenant already has an active contract
    if (status === "ACTIVE") {
      const activeContract = await prisma.contract.findFirst({
        where: {
          tenantId,
          status: "ACTIVE",
        },
      });

      if (activeContract) {
        return errorResponse("Khách thuê này hiện đã có 1 hợp đồng đang có hiệu lực!", 400);
      }
    }

    const contract = await prisma.$transaction(async (tx) => {
      const c = await tx.contract.create({
        data: {
          tenantId,
          roomId,
          startDate: start,
          endDate: end,
          rentPrice: Number(rentPrice),
          deposit: Number(deposit),
          paymentCycle: Number(paymentCycle),
          terms: terms?.trim() || null,
          status,
        },
        include: {
          tenant: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          room: true,
        },
      });

      // Update tenant room assignment
      await tx.tenant.update({
        where: { id: tenantId },
        data: { roomId, status: "ACTIVE" },
      });

      // Update room status
      if (status === "ACTIVE") {
        await tx.room.update({
          where: { id: roomId },
          data: { status: "OCCUPIED" },
        });
      }

      return c;
    });

    return successResponse(contract, "Tạo hợp đồng thành công", 201);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tạo hợp đồng", 500);
  }
}
