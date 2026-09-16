import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Chưa đăng nhập", 401);
    }
    return successResponse(user);
  } catch (error: any) {
    return errorResponse("Lỗi khi lấy thông tin người dùng", 500);
  }
}
