import { queryAlipayPayment } from "../../../modules/payment/service";

export async function onQueryAlipayPayment(input: { orderNo: string }) {
  return queryAlipayPayment(input.orderNo);
}