import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { databaseUrl } from "./databaseUrl";

// Prisma 7 connects through a driver adapter rather than a `url` in
// schema.prisma. The mariadb driver is Prisma's supported adapter for MySQL.
//
// Next.js recreates modules on every hot reload in development, which would
// open a new connection pool each time until MySQL refuses them. Caching the
// client on globalThis keeps a single pool across reloads.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl()),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
