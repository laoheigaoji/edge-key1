export interface CreatePaymentInput {
  orderNo: string;
  amount: number;
  productName: string;
  notifyUrl: string;
  returnUrl: string;
  paymentChannel?: string;
}

export interface CreatePaymentResult {
  payUrl: string;
  paymentOrderNo?: string;
  raw?: unknown;
}

export interface VerifyNotifyResult {
  isValid: boolean;
  orderNo?: string;
  paymentOrderNo?: string;
  amount?: number;
  status?: "PENDING" | "PAID" | "FAILED";
  raw: Record<string, string>;
  message?: string;
}

export interface PaymentProviderAdapter {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyNotify(payload: Record<string, string>): Promise<VerifyNotifyResult>;
}
