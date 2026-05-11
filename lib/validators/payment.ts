import { badRequestError } from "../app-error";

export function validatePaymentConfigInput(input: {
  name?: string;
  baseUrl?: string;
  provider: string;
  isEnabled?: boolean;
  appSecret?: string;
  pid?: string;
  key?: string;
}) {
  const name = input.name?.trim() || "";
  if (!name) {
    throw badRequestError("支付方式名称不能为空", "PAYMENT_NAME_REQUIRED");
  }

  const baseUrl = input.baseUrl?.trim() || "";
  if (input.isEnabled !== false && !baseUrl) {
    throw badRequestError("启用支付方式时必须填写网关地址", "PAYMENT_BASE_URL_REQUIRED");
  }

  if (input.provider === "BEPUSDT" && input.isEnabled !== false && !(input.appSecret?.trim())) {
    throw badRequestError("启用 BEpusdt 时必须填写 App Secret", "BEPUSDT_APP_SECRET_REQUIRED");
  }

  if (input.provider === "EPAY" && input.isEnabled !== false) {
    if (!(input.pid?.trim())) {
      throw badRequestError("启用 Epay 时必须填写 PID", "EPAY_PID_REQUIRED");
    }
    if (!(input.key?.trim())) {
      throw badRequestError("启用 Epay 时必须填写 Key", "EPAY_KEY_REQUIRED");
    }
  }

  return {
    name,
    baseUrl,
  };
}
