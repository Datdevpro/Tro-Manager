import { SignJWT, jwtVerify } from "jose";

const rawSecret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && (!rawSecret || rawSecret.length < 32)) {
  console.warn(
    "⚠️ [SECURITY WARNING] Biến môi trường JWT_SECRET chưa được thiết lập hoặc quá ngắn trong môi trường production! Vui lòng cấu hình JWT_SECRET mạnh mẽ trên Vercel/Hosting."
  );
}

const SECRET = new TextEncoder().encode(
  rawSecret || "tromanage_super_secret_jwt_key_2026_production_safe_string_12345"
);

export const SESSION_COOKIE_NAME = "tro_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "USER";
  fullName: string;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
