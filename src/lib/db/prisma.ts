import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

// On Vercel Serverless, globalThis persists across warm invocations in the same Lambda.
// This prevents creating a new PrismaClient on every request (which exhausts DB connections).
// See: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
export const prisma = global._prisma ?? createPrismaClient();

// Cache the client globally to reuse across requests in same Lambda instance
global._prisma = prisma;
