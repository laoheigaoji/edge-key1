import type { PaymentProvider } from "../payment/types";

export interface CreateOrderInput {
  productId: number;
  quantity: number;
  paymentProvider: PaymentProvider;
  contactType: "EMAIL" | "QQ" | "TELEGRAM" | "OTHER";
  contactValue?: string;
  buyerNote?: string;
}
