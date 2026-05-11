import { createHash } from "node:crypto";
import { createBepusdtAdapter } from "../modules/payment/bepusdt";
import { createEpayAdapter } from "../modules/payment/epay";

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

function signEpay(payload: Record<string, string | number>, key: string) {
  const base = Object.entries(payload)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");

  return createHash("md5").update(`${base}${key}`).digest("hex");
}

async function verifyBepusdtAdapter() {
  const adapter = createBepusdtAdapter({
    baseUrl: "https://bep.example.com",
    appSecret: "secret-token",
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    return new Response(
      JSON.stringify({
        status_code: 200,
        message: "success",
        data: {
          trade_id: "trade_123",
          payment_url: "https://bep.example.com/pay/trade_123",
        },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }) as typeof fetch;

  try {
    const created = await adapter.createPayment({
      orderNo: "ORD123",
      amount: 1234,
      productName: "test product",
      notifyUrl: "https://shop.example.com/api/payments/bepusdt/notify",
      returnUrl: "https://shop.example.com/order/ORD123?token=abc",
    });

    assert(created.payUrl.includes("trade_123"), "BEpusdt createPayment should return payUrl");

    const notifyPayload = {
      trade_id: "trade_123",
      order_id: "ORD123",
      amount: "12.34",
      actual_amount: "1.70",
      token: "USDT",
      block_transaction_id: "tx_hash",
      status: "2",
    };

    const verify = await adapter.verifyNotify({
      ...notifyPayload,
      signature: signBepusdt(notifyPayload, "secret-token"),
    });

    assert(verify.isValid, "BEpusdt verifyNotify should validate signature");
    assert(verify.orderNo === "ORD123", "BEpusdt verifyNotify should return order number");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function verifyEpayAdapter() {
  const adapter = createEpayAdapter({
    baseUrl: "https://epay.example.com",
    pid: "1000",
    key: "epay-key",
  });

  const created = await adapter.createPayment({
    orderNo: "ORD456",
    amount: 4567,
    productName: "epay product",
    notifyUrl: "https://shop.example.com/api/payments/epay/notify",
    returnUrl: "https://shop.example.com/order/ORD456?token=xyz",
  });

  assert(created.payUrl.includes("submit.php"), "Epay createPayment should build gateway URL");
  assert(created.payUrl.includes("out_trade_no=ORD456"), "Epay createPayment should include order number");

  const notifyPayload = {
    pid: "1000",
    out_trade_no: "ORD456",
    trade_no: "EPAY_TRADE_1",
    money: "45.67",
    trade_status: "TRADE_SUCCESS",
  };

  const verify = await adapter.verifyNotify({
    ...notifyPayload,
    sign: signEpay(notifyPayload, "epay-key"),
    sign_type: "MD5",
  });

  assert(verify.isValid, "Epay verifyNotify should validate signature");
  assert(verify.orderNo === "ORD456", "Epay verifyNotify should return order number");
}

await verifyBepusdtAdapter();
await verifyEpayAdapter();

console.log("Payment adapter smoke verification passed.");
