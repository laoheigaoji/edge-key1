import { getContext } from "telefunc";
import type { PrismaClient } from "../../../generated/prisma/client";
import { getAdminContext } from "../../../modules/auth/service";

export async function onQueryOrders(input: {
  orderNo?: string;
  productName?: string;
  paymentProvider?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}) {
  const { prisma } = getAdminContext() as { prisma: PrismaClient };

  const where: Record<string, unknown> = {};
  if (input.orderNo) where.orderNo = { contains: input.orderNo };
  if (input.productName) where.productNameSnapshot = { contains: input.productName };
  if (input.paymentProvider) where.paymentProvider = input.paymentProvider;
  if (input.status) where.status = input.status;
  if (input.startDate || input.endDate) {
    where.createdAt = {
      ...(input.startDate ? { gte: new Date(input.startDate) } : {}),
      ...(input.endDate ? { lt: new Date(new Date(input.endDate).getTime() + 86400000) } : {}),
    };
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,include: { product: true },
    }),
  ]);

  return {
    total,
    items: orders.map((order) => ({
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
  };
}