import type { PrismaClient } from "../../../generated/prisma/client";
import { getSiteSetting } from "../../../modules/site/service";

export type Data = ReturnType<typeof data>;

export async function data(pageContext: { prisma: PrismaClient }) {
  return {
    site: await getSiteSetting(pageContext.prisma),
  };
}
