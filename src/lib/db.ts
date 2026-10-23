import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const rawUrl = process.env.DATABASE_URL;
const sanitizedUrl = rawUrl?.replace(/^["']|["']$/g, "").trim();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(sanitizedUrl ? { datasources: { db: { url: sanitizedUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

