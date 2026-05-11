import type { PrismaClient } from "../../../../generated/prisma/client";
import { getAdminCategories } from "../../../../modules/catalog/service";

export type Data = ReturnType<typeof data>;

export async function data(pageContext: {
  prisma: PrismaClient;
  session?: { user?: { role?: string } };
}) {
  if (pageContext.session?.user?.role !== "admin") {
    return {
      categories: [],
    };
  }

  return {
    categories: await getAdminCategories(pageContext.prisma),
  };
}
