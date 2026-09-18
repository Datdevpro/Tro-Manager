import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { signToken, SESSION_COOKIE_NAME } from "@/lib/auth/jwt";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Vui lòng cung cấp email và mật khẩu", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const rateLimitKey = `login:${clientIp}:${normalizedEmail}`;

    // Protect against brute force: max 5 attempts per 15 minutes
    const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return errorResponse(
        `Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${rateCheck.retryAfterSeconds} giây.`,
        429
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return errorResponse("Email hoặc mật khẩu không chính xác", 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse("Email hoặc mật khẩu không chính xác", 401);
    }

    // Reset rate limit on successful authentication
    resetRateLimit(rateLimitKey);

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const token = await signToken(payload);
    const redirectUrl = user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard";

    const response = successResponse(
      {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        redirectUrl,
      },
      "Đăng nhập thành công"
    );

    // Set HTTP-Only session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return errorResponse("Đã xảy ra lỗi hệ thống khi đăng nhập", 500);
  }
}
