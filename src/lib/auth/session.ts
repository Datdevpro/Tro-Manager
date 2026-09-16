import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyToken, SessionPayload } from "./jwt";
import { prisma } from "@/lib/db/prisma";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      tenant: {
        include: {
          room: {
            include: {
              property: true,
            },
          },
        },
      },
    },
  });

  return user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireTenant() {
  const session = await requireAuth();
  if (session.role !== "USER") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
