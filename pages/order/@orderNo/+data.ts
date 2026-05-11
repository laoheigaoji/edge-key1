import type { PrismaClient } from "../../../generated/prisma/client";
import { getOrderForQuery } from "../../../modules/order/service";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: {
  routeParams: { orderNo: string };
  urlParsed: { search: Record<string, string | undefined> };
  prisma: PrismaClient;
}) {
  const token = pageContext.urlParsed.search.token || "";
  return {
    order: await getOrderForQuery(pageContext.routeParams.orderNo, token, pageContext.urlParsed.search, pageContext.prisma),
  };
}
