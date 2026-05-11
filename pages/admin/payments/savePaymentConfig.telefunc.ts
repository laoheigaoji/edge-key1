import { assertAdminAccess } from "../../../modules/auth/service";
import { savePaymentConfig } from "../../../modules/payment/service";
import type { PaymentProvider } from "../../../modules/payment/types";

export async function onSavePaymentConfig(input: {
  provider: PaymentProvider;
  name: string;
  isEnabled: boolean;
  baseUrl: string;
  appId?: string;
  appSecret?: string;
  pid?: string;
  key?: string;
  notifyUrl?: string;
  returnUrl?: string;
  alipayAppId?: string;
  alipayPrivateKey?: string;
  alipayPublicKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripeCurrency?: string;
}) {
  assertAdminAccess();
  return savePaymentConfig(input);
}
