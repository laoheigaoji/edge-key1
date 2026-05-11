import type { PrismaClient } from "../../../../../generated/prisma/client";
import { getAdminCategories, getAdminProductById } from "../../../../../modules/catalog/service";

export type Data = ReturnType<typeof data>;

export async function data(pageContext: {
  routeParams: { id: string };
  prisma: PrismaClient;
  session?: { user?: { role?: string } };
}) {
  if (pageContext.session?.user?.role !== "admin") {
    return {
      productId: pageContext.routeParams.id,
      categories: [],
      product: null,
    };
  }

  const productId = Number(pageContext.routeParams.id);
  return {
    productId,
    categories: await getAdminCategories(pageContext.prisma),
    product: Number.isFinite(productId) ? await getAdminProductById(productId, pageContext.prisma) : null,
  };
}
