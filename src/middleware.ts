import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, SESSION_COOKIE_NAME } from "@/lib/auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  const isAdminRoute = pathname.startsWith("/admin");
  const isTenantRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/contract") ||
    pathname.startsWith("/profile");

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/forgot-password";

  // 1. If accessing protected routes without session -> Redirect to /login
  if ((isAdminRoute || isTenantRoute) && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 2. If authenticated user tries to access /login or /forgot-password
  if (isAuthRoute && session) {
    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Role enforcement: USER cannot access /admin/*
  if (isAdminRoute && session && session.role !== "ADMIN") {
    // Redirect non-admin to tenant dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/invoices/:path*",
    "/payments/:path*",
    "/contract/:path*",
    "/profile/:path*",
    "/login",
    "/forgot-password",
  ],
};
