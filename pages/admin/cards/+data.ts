import type { PrismaClient } from "../../../generated/prisma/client";
import { getAdminProducts } from "../../../modules/catalog/service";
import { getAdminCards, getInventoryOverview } from "../../../modules/inventory/service";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: {
  prisma: PrismaClient;
  session?: { user?: { role?: string } };
}) {
  if (pageContext.session?.user?.role !== "admin") {
    return {
      cards: [],
      products: [],
      overview: { total: 0, available: 0, sold: 0 },
    };
  }

  return {
    cards: await getAdminCards(pageContext.prisma),
    products: await getAdminProducts(pageContext.prisma),
    overview: await getInventoryOverview(pageContext.prisma),
  };
}
