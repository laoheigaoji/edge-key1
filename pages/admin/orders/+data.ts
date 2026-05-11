import type { PrismaClient } from "../../../generated/prisma/client";

const PAGE_SIZE = 20;

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: {
  prisma: PrismaClient;
  session?: { user?: { role?: string } };
}) {
  if (pageContext.session?.user?.role !== "admin") {
    return { orders: { items: [], total: 0 } };
  }

  const [total, rows] = await Promise.all([
    pageContext.prisma.order.count(),
    pageContext.prisma.order.findMany({
      orderBy: { id: "desc" },
      take: PAGE_SIZE,
      include: { product: true },
    }),
  ]);

  return {
    orders: {
      total,
      items: rows.map((order) => ({
        id: order.id,
        orderNo: order.orderNo,
        productName: order.productNameSnapshot,
        amount: order.amount,
        paymentProvider: order.paymentProvider,
        status: order.status,
        paymentStatus: order.paymentStatus,
        deliveryStatus: order.deliveryStatus,
        createdAt: order.createdAt.toISOString(),
      })),
    },
  };
}