import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import bcrypt from "bcryptjs";

// GET /api/tenants - list all tenants with pagination & search
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const roomId = searchParams.get("roomId");

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "20"));

    const where: any = {};
    if (status) where.status = status;
    if (roomId) where.roomId = roomId;
    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { idNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, tenants] = await Promise.all([
      prisma.tenant.count({ where }),
      prisma.tenant.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
          },
          room: {
            include: {
              property: { select: { id: true, name: true } },
            },
          },
          contracts: {
            where: { status: "ACTIVE" },
            take: 1,
          },
        },
      }),
    ]);

    return successResponse({
      items: tenants,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tải danh sách người thuê", 500);
  }
}

// POST /api/tenants - create new tenant & user account
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    const {
      fullName,
      email,
      phone,
      password = "User123!",
      idNumber = "",
      birthday,
      gender = "Nam",
      permanentAddress,
      roomId,
      startDate = new Date(),
    } = body;

    if (!fullName || !email) {
      return errorResponse("Vui lòng nhập họ tên và email người thuê", 400);
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return errorResponse(`Email ${email} đã tồn tại trong hệ thống`, 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim() || null,
          passwordHash,
          role: "USER",
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          userId: user.id,
          roomId: roomId || null,
          idNumber: idNumber?.trim() || "",
          birthday: birthday ? new Date(birthday) : null,
          gender,
          permanentAddress: permanentAddress?.trim() || null,
          startDate: new Date(startDate),
          status: "ACTIVE",
        },
        include: {
          user: true,
          room: true,
        },
      });

      // If assigned to a room, check if room should be OCCUPIED
      if (roomId) {
        await tx.room.update({
          where: { id: roomId },
          data: { status: "OCCUPIED" },
        });
      }

      return tenant;
    });

    return successResponse(result, "Tạo hồ sơ khách thuê thành công", 201);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return errorResponse("Chưa đăng nhập", 401);
    if (error.message === "FORBIDDEN") return errorResponse("Không có quyền quản trị", 403);
    return errorResponse("Lỗi khi tạo người thuê", 500);
  }
}
