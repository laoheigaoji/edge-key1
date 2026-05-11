import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "../generated/prisma/client";

const prismaCache = new WeakMap<D1Database, PrismaClient>();

// Reuse one Prisma client per D1 binding within the same isolate.
export function getPrismaForD1(database: D1Database) {
  const cached = prismaCache.get(database);
  if (cached) {
    return cached;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaD1(database),
  });

  prismaCache.set(database, prisma);
  return prisma;
}

