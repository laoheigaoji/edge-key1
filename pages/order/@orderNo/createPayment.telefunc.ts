import { createPaymentForExistingOrder } from "../../../modules/order/service";

export async function onCreatePayment(input: { orderId: number }) {
  return createPaymentForExistingOrder(input.orderId);
}
