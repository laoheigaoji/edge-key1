import { createHash } from "node:crypto";
import { badRequestError } from "../../lib/app-error";
import type { PaymentProviderAdapter } from "./provider";

interface EpayConfig {
  baseUrl: string;
  pid?: string;
  key?: string;
  notifyUrl?: string;
  returnUrl?: string;
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function signEpay(payload: Record<string, string | number>, key: string) {
  const base = Object.entries(payload)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");

  return createHash("md5").update(`${base}${key}`).digest("hex");
}

export function createEpayAdapter(config: EpayConfig): PaymentProviderAdapter {
  return {
    async createPayment(input) {
      if (!config.baseUrl || !config.pid || !config.key) {
        throw badRequestError("Epay 配置不完整", "EPAY_CONFIG_INCOMPLETE");
      }

      const paymentChannel = input.paymentChannel === "wxpay" ? "wxpay" : "alipay";

      const payload = {
        pid: config.pid,
        type: paymentChannel,
        out_trade_no: input.orderNo,
        notify_url: input.notifyUrl,
        return_url: input.returnUrl,
        name: input.productName,
        money: (input.amount / 100).toFixed(2),
      };

      const sign = signEpay(payload, config.key);
      const payUrl = `${normalizeBaseUrl(config.baseUrl)}/submit.php?${new URLSearchParams({
        ...payload,
        sign,
        sign_type: "MD5",
      }).toString()}`;

      return {
        payUrl,
        paymentOrderNo: input.orderNo,
        raw: payload,
      };
    },

    async verifyNotify(payload) {
      if (!config.key || !config.pid) {
        return {
          isValid: false,
          raw: payload,
          message: "missing epay config",
        };
      }

      const signature = payload.sign || "";
      const unsignedPayload = { ...payload };
      delete unsignedPayload.sign;
      delete unsignedPayload.sign_type;
      const expected = signEpay(unsignedPayload, config.key);
      const tradeStatus = payload.trade_status || payload.status || "";
      const isPidMatched = payload.pid === config.pid;
      const isSignatureMatched = signature === expected;
      const isValid = isPidMatched && isSignatureMatched;

      return {
        isValid,
        orderNo: payload.out_trade_no,
        paymentOrderNo: payload.trade_no,
        amount: payload.money ? Math.round(Number(payload.money) * 100) : undefined,
        status: tradeStatus === "TRADE_SUCCESS" || tradeStatus === "success" ? "PAID" : tradeStatus ? "FAILED" : "PENDING",
        raw: payload,
        message: !isPidMatched ? "invalid pid" : isSignatureMatched ? "ok" : "invalid signature",
      };
    },
  };
}
