import { createHash } from "node:crypto";
import { handlePaymentNotify } from "../modules/payment/service";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function signBepusdt(payload: Record<string, string | number>, secret: string) {
  const base = Object.entries(payload)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("md5").update(`${base}${secret}`).digest("hex");
}

function createMockPrisma() {
  const state = {
    order: {
      id: 1,
      orderNo: "ORD-NOTIFY-1",
      queryToken: "token-1",
      productId: 1,
      productNameSnapshot: "Notify Product",
      unitPrice: 1234,
      quantity: 1,
      amount: 1234,
      paymentProvider: "BEPUSDT",
      paymentStatus: "UNPAID",
      deliveryStatus: "NOT_DELIVERED",
      status: "PENDING",
      paymentOrderNo: null,
      paidAt: null,
      deliveredAt: null,
    },
    cards: [
      {
        id: 1,
        productId: 1,
        content: "CARD-001-SECRET",
        status: "UNUSED",
        orderId: null,
        soldAt: null,
      },
    ],
    paymentConfigs: [
      {
        provider: "BEPUSDT",
        name: "USDT",
        isEnabled: true,
        configJson: JSON.stringify({
          baseUrl: "https://bep.example.com",
          appSecret: "secret-token",
          notifyUrl: "/api/payments/bepusdt/notify",
        }),
      },
      {
        provider: "EPAY",
        name: "聚合支付",
        isEnabled: true,
        configJson: JSON.stringify({
          baseUrl: "https://epay.example.com",
          key: "epay-key",
          notifyUrl: "/api/payments/epay/notify",
        }),
      },
    ],
    paymentLogs: [] as any[],
    deliveries: [] as any[],
  };

  const prisma = {
    paymentConfig: {
      async findMany() {
        return state.paymentConfigs;
      },
      async findUnique({ where }: any) {
        return state.paymentConfigs.find((item) => item.provider === where.provider) ?? null;
      },
    },
    paymentLog: {
      async create({ data }: any) {
        state.paymentLogs.push(data);
        return data;
      },
    },
    order: {
      async findUnique({ where, include }: any) {
        if (where.orderNo && where.orderNo !== state.order.orderNo) return null;
        if (where.id && where.id !== state.order.id) return null;

        if (include) {
          return {
            ...state.order,
            product: { id: 1, slug: "notify-product", name: "Notify Product" },
            deliveries: state.deliveries,
            cards: state.cards.filter((item) => item.orderId === state.order.id),
            paymentLogs: state.paymentLogs,
          };
        }

        return { ...state.order };
      },
      async update({ where, data }: any) {
        assert(where.orderNo === state.order.orderNo || where.id === state.order.id, "unexpected order update target");
        Object.assign(state.order, data);
        return { ...state.order };
      },
      async updateMany({ where, data }: any) {
        const matchesOrderNo = !where.orderNo || where.orderNo === state.order.orderNo;
        const matchesPaymentStatus = !where.paymentStatus || where.paymentStatus === state.order.paymentStatus;

        if (!matchesOrderNo || !matchesPaymentStatus) {
          return { count: 0 };
        }

        Object.assign(state.order, data);
        return { count: 1 };
      },
    },
    card: {
      async findMany({ where, take }: any) {
        return state.cards
          .filter((item) => item.productId === where.productId && item.status === where.status)
          .slice(0, take)
          .map((item) => ({ ...item }));
      },
      async update({ where, data }: any) {
        const card = state.cards.find((item) => item.id === where.id);
        assert(card, "card not found");
        const existingCard = card!;
        Object.assign(existingCard, data);
        return { ...existingCard };
      },
    },
    orderDelivery: {
      async create({ data }: any) {
        const record = { id: state.deliveries.length + 1, ...data };
        state.deliveries.push(record);
        return record;
      },
    },
  };

  return { prisma: prisma as any, state };
}

async function verifySuccessAndIdempotency() {
  const { prisma, state } = createMockPrisma();
  const payload = {
    trade_id: "trade_notify_1",
    order_id: "ORD-NOTIFY-1",
    amount: "12.34",
    actual_amount: "1.88",
    token: "USDT",
    block_transaction_id: "tx_hash_1",
    status: "2",
  };

  const signed = {
    ...payload,
    signature: signBepusdt(payload, "secret-token"),
  };

  const first = await handlePaymentNotify("BEPUSDT", signed, prisma, "notify");
  assert(first.ok, "first notify should succeed");
  assert(state.order.paymentStatus === "PAID", "order should be marked paid");
  assert(state.order.deliveryStatus === "DELIVERED", "order should be delivered");
  assert(state.deliveries.length === 1, "delivery should be created once");

  const second = await handlePaymentNotify("BEPUSDT", signed, prisma, "notify");
  assert(second.ok, "second notify should still return ok");
  assert(state.deliveries.length === 1, "duplicate notify should not redeliver");
}

async function verifyAmountMismatch() {
  const { prisma, state } = createMockPrisma();
  const payload = {
    trade_id: "trade_notify_2",
    order_id: "ORD-NOTIFY-1",
    amount: "88.88",
    actual_amount: "9.99",
    token: "USDT",
    block_transaction_id: "tx_hash_2",
    status: "2",
  };

  const signed = {
    ...payload,
    signature: signBepusdt(payload, "secret-token"),
  };

  const result = await handlePaymentNotify("BEPUSDT", signed, prisma, "notify");
  assert(!result.ok, "amount mismatch notify should fail");
  assert(state.order.paymentStatus === "UNPAID", "order payment status should stay unpaid");
  assert(state.deliveries.length === 0, "amount mismatch should not deliver");
}

await verifySuccessAndIdempotency();
await verifyAmountMismatch();

console.log("Payment notify verification passed.");
