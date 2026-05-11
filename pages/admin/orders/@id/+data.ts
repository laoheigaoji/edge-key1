import type { PrismaClient } from "../../../../generated/prisma/client";
import { getAdminOrderById } from "../../../../modules/order/service";

export type Data = ReturnType<typeof data>;

export async function data(pageContext: {
  routeParams: { id: string };
  prisma: PrismaClient;
  session?: { user?: { role?: string } };
}) {
  const orderId = Number(pageContext.routeParams.id);

  if (pageContext.session?.user?.role !== "admin") {
    return {
      orderId,
      order: null,
    };
  }

  return {
    orderId,
    order: Number.isFinite(orderId) ? await getAdminOrderById(orderId, pageContext.prisma) : null,
  };
}
