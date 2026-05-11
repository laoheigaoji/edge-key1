import { createOrder } from "../../../modules/order/service";
import type { PaymentProvider } from "../../../modules/payment/types";

export async function onCreateOrder(input: {
  productId: number;
  quantity: number;
  paymentProvider: PaymentProvider;
  paymentChannel?: string;
  contactType: "EMAIL";
  contactValue: string;
  buyerNote?: string;
}) {
  return createOrder(input);
}
