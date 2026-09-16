import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return errorResponse("Vui lòng cung cấp email", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // For security reasons, don't reveal if email exists, but return friendly message
    if (!user) {
      return successResponse(
        null,
        "Nếu email này tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi hoặc vui lòng liên hệ Ban quản lý tòa nhà."
      );
    }

    return successResponse(
      null,
      "Yêu cầu đặt lại mật khẩu đã được ghi nhận. Trong môi trường quản lý nhà trọ, bạn có thể liên hệ trực tiếp Ban Quản Lý hoặc sử dụng tài khoản mẫu."
    );
  } catch (error: any) {
    return errorResponse("Lỗi khi gửi yêu cầu quên mật khẩu", 500);
  }
}
