import type { PrismaClient } from "../../generated/prisma/client";
import { getHomeCatalog } from "../../modules/catalog/service";
import { getPublicSiteInfo } from "../../modules/site/service";

export type Data = ReturnType<typeof data>;

export async function data(pageContext: { prisma: PrismaClient }) {
  return {
    site: await getPublicSiteInfo(pageContext.prisma),
    catalog: await getHomeCatalog(pageContext.prisma),
  };
}
