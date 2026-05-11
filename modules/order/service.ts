import { getContext } from "telefunc";
import type { PaymentProvider } from "../payment/types";
import type { PrismaClient } from "../../generated/prisma/client";
import { conflictError, notFoundError } from "../../lib/app-error";
import { validateOrderInput } from "../../lib/validators/order";
import { getAdminContext, logAdminOperation } from "../auth/service";
import { getAdminProductById } from "../catalog/service";
import { createPaymentForOrder, handlePaymentNotify } from "../payment/service";
import { closeOrderRecord, createOrderRecord, findOrderById, findOrderWithProduct, listOrderRecords } from "./repository";
import { generateOrderNo, generateQueryToken } from "./number";
import { logger } from "../../lib/logger";

function getOrderContext() {
  return getContext<{ prisma: PrismaClient }>();
}

function pickEpayReturnPayload(searchParams?: Record<string, string | undefined>) {
  const allowedKeys = new Set([
    "pid",
    "trade_no",
    "out_trade_no",
    "type",
    "name",
    "money",
    "trade_status",
    "param",
    "sign",
    "sign_type",
  ]);

  return Object.fromEntries(
    Object.entries(searchParams ?? {}).filter(([key, value]) => allowedKeys.has(key) && typeof value === "string" && value.length > 0),
  ) as Record<string, string>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createOrder(input: {
  productId: number;
  quantity: number;
  paymentProvider: PaymentProvider;
  paymentChannel?: string;
  contactType: "EMAIL" | "QQ" | "TELEGRAM" | "OTHER";
  contactValue?: string;
  buyerNote?: string;
}) {
  const { prisma } = getOrderContext();
  const { contactValue } = validateOrderInput(input);
  const product = await getAdminProductById(input.productId, prisma);

  if (!product || product.status !== "ACTIVE") {
    throw notFoundError("商品不存在或未上架", "PRODUCT_NOT_AVAILABLE");
  }

  const quantity = Math.max(product.minBuy, Math.min(product.maxBuy, Math.floor(input.quantity)));
  const orderNo = generateOrderNo();
  const queryToken = generateQueryToken();
  let paymentChannel: string | null = null;
  if (input.paymentProvider === "EPAY") {
    paymentChannel = input.paymentChannel === "wxpay" ? "wxpay" : "alipay";
  } else if (input.paymentProvider === "ALIPAY") {
    paymentChannel = input.paymentChannel ?? "alipay_h5";
  }

  const order = await createOrderRecord(prisma, {
    orderNo,
    queryToken,
    productId: product.id,
    productNameSnapshot: product.name,
    unitPrice: product.price,
    quantity,
    amount: product.price * quantity,
    contactType: input.contactType,
    contactValue,
    buyerNote: input.buyerNote?.trim() || null,
    paymentProvider: input.paymentProvider,
    paymentChannel,
  });

  return {
    id: order.id,
    orderNo: order.orderNo,
    queryToken: order.queryToken,
    amount: order.amount,
    paymentProvider: order.paymentProvider,
    paymentChannel: order.paymentChannel,
    ...(await createPaymentForOrder(order.orderNo, prisma)),
  };
}

export async function getOrderForQuery(
  orderNo: string,
  queryToken: string,
  searchParams?: Record<string, string | undefined>,
  prisma?: PrismaClient,
) {
  const client = prisma ?? getOrderContext().prisma;
  let order = await findOrderWithProduct(client, orderNo);

  if (!order || order.queryToken !== queryToken) {
    return null;
  }

  const epayReturnPayload = pickEpayReturnPayload(searchParams);

  const canSyncEpayReturn =
    order.paymentProvider === "EPAY" &&
    (epayReturnPayload.out_trade_no || "") === orderNo &&
    Boolean(epayReturnPayload.sign) &&
    Boolean(epayReturnPayload.trade_status);

  if (canSyncEpayReturn) {
    await handlePaymentNotify("EPAY", epayReturnPayload, client, "return");
    order = await findOrderWithProduct(client, orderNo);

    if (!order || order.queryToken !== queryToken) {
      return null;
    }
  }

  // notify 与 return 几乎同时到达时，return 这次读取可能正好卡在
  // “订单已支付但异步发货还没写完”的瞬间。这里做一次短暂重查，
  // 优先把最终的 DELIVERED 状态和发货内容返回给页面，避免用户手动刷新。
  if (order.paymentStatus === "PAID" && order.deliveryStatus === "NOT_DELIVERED") {
    for (let index = 0; index < 3; index += 1) {
      await sleep(150);
      const refreshed = await findOrderWithProduct(client, orderNo);
      if (!refreshed || refreshed.queryToken !== queryToken) {
        break;
      }
      order = refreshed;
      if (order.deliveryStatus !== "NOT_DELIVERED") {
        break;
      }
    }
  }

  return {
    id: order.id,
    orderNo: order.orderNo,
    queryToken: order.queryToken,
    status: order.status,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    productName: order.productNameSnapshot,
    quantity: order.quantity,
    amount: order.amount,
    paymentProvider: order.paymentProvider,
    productSlug: order.product.slug,
    createdAt: order.createdAt.toISOString(),
    deliveryContents: order.deliveries.flatMap((item) => {
      try {
        const parsed = JSON.parse(item.contentSnapshot) as string[];
        return Array.isArray(parsed) ? parsed : [item.contentSnapshot];
      } catch {
        return [item.contentSnapshot];
      }
    }),
  };
}

export async function getAdminOrders(prisma?: PrismaClient) {
  const client = prisma ?? getOrderContext().prisma;
  const orders = await listOrderRecords(client);

  return orders.map((order) => ({
    id: order.id,
    orderNo: order.orderNo,
    productName: order.productNameSnapshot,
    amount: order.amount,
    quantity: order.quantity,
    paymentProvider: order.paymentProvider,
    status: order.status,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    createdAt: order.createdAt.toISOString(),
  }));
}

export async function createPaymentForExistingOrder(orderId: number) {
  const { prisma } = getOrderContext();
  const order = await findOrderById(prisma, orderId);

  if (!order) {
    throw notFoundError("订单不存在", "ORDER_NOT_FOUND");
  }

  return createPaymentForOrder(order.orderNo, prisma);
}

export async function closeOrder(orderId: number) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const order = await closeOrderRecord(prisma, orderId);

  await logAdminOperation(
    {
      action: "CLOSE_ORDER",
      targetType: "Order",
      targetId: String(order.id),
      detail: `orderNo=${order.orderNo}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return {
    id: order.id,
    status: order.status,
  };
}

export async function getDashboardMetrics(prisma?: PrismaClient) {
  const client = prisma ?? getOrderContext().prisma;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayOrders, paidTodayOrders, productCount, availableCards] = await Promise.all([
    client.order.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    }),
    client.order.findMany({
      where: {
        paymentStatus: "PAID",
        paidAt: {
          gte: today,
        },
      },
      select: {
        amount: true,
      },
    }),
    client.product.count(),
    client.card.count({
      where: {
        status: "UNUSED",
      },
    }),
  ]);

  const paidAmount = paidTodayOrders.reduce((sum, item) => sum + item.amount, 0);

  return [
    { label: "今日订单", value: String(todayOrders) },
    { label: "今日成交额", value: (paidAmount / 100).toFixed(2) },
    { label: "商品数", value: String(productCount) },
    { label: "剩余卡密", value: String(availableCards) },
  ];
}

export async function getAdminOrderById(id: number, prisma?: PrismaClient) {
  const client = prisma ?? getOrderContext().prisma;
  const order = await findOrderById(client, id);
  if (!order) {
    return null;
  }

  return {
    id: order.id,
    orderNo: order.orderNo,
    queryToken: order.queryToken,
    productName: order.productNameSnapshot,
    amount: order.amount,
    quantity: order.quantity,
    paymentProvider: order.paymentProvider,
    paymentChannel: order.paymentChannel,
    status: order.status,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    contactValue: order.contactValue,
    buyerNote: order.buyerNote,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
    cards: order.cards.map((card) => ({
      id: card.id,
      content: card.content,
      status: card.status,
    })),
    deliveries: order.deliveries.map((item) => ({
      id: item.id,
      contentSnapshot: item.contentSnapshot,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    })),
    paymentLogs: order.paymentLogs.map((item) => ({
      id: item.id,
      eventType: item.eventType,
      verifyStatus: item.verifyStatus,
      message: item.message,
      rawPayload: item.rawPayload,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

/**
 * 自动关闭过期未支付订单（由 Cron Trigger 定时调用）
 *
 * 逻辑：
 * 1. 查询所有 status=PENDING、paymentStatus=UNPAID、且创建时间超过 TTL 的订单
 * 2. 将其 status 更新为 CLOSED，设置 closedAt
 * 3. 为每个被关闭的订单写入一条 PaymentLog（eventType=AUTO_CLOSE）
 * 4. 不修改 paymentStatus，避免与延迟到达的支付回调产生竞态冲突
 *
 * 竞态安全说明：
 * - 如果支付回调在 auto-close 之后到达，updateOrderPayment 的 WHERE
 *   条件 `paymentStatus = "UNPAID"` 仍然匹配（因为 auto-close 不动该字段），
 *   回调会将订单重新打开为 PAID 并正常发货。
 * - 该场景会在 PaymentLog 中留下 "(reopened from CLOSED)" 标记。
 */
const ORDER_EXPIRE_MINUTES = 30;

export async function autoCloseExpiredOrders(prisma: PrismaClient) {
  const cutoff = new Date(Date.now() - ORDER_EXPIRE_MINUTES * 60 * 1000);

  // 先查出即将被关闭的订单（需要 orderId、orderNo、paymentProvider 用于写日志）
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      paymentStatus: "UNPAID",
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      orderNo: true,
      paymentProvider: true,
    },
    take: 100,
  });

  if (expiredOrders.length === 0) {
    return 0;
  }

  // 批量关闭
  await prisma.order.updateMany({
    where: {
      id: { in: expiredOrders.map((o) => o.id) },
    },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
    },
  });

  // 为每个被关闭的订单写一条 PaymentLog
  await prisma.paymentLog.createMany({
    data: expiredOrders.map((order) => ({
      orderId: order.id,
      provider: order.paymentProvider,
      orderNo: order.orderNo,
      eventType: "AUTO_CLOSE",
      rawPayload: "{}",
      verifyStatus: "PENDING" as const,
      message: `订单超时未支付，已自动关闭（${ORDER_EXPIRE_MINUTES}分钟）`,
    })),
  });

  logger.info("auto_close_expired_orders", {
    closedCount: expiredOrders.length,
    expireMinutes: ORDER_EXPIRE_MINUTES,
    orderNos: expiredOrders.map((o) => o.orderNo),
  });

  return expiredOrders.length;
}
