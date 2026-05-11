import { assertAdminAccess } from "../../../../modules/auth/service";
import { closeOrder } from "../../../../modules/order/service";

export async function onCloseOrder(input: { orderId: number }) {
  assertAdminAccess();
  return closeOrder(input.orderId);
}
