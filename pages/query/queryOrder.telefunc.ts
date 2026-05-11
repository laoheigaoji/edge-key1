import { getOrderForQuery } from "../../modules/order/service";

export async function onQueryOrder(input: { orderNo: string; queryToken: string }) {
  return getOrderForQuery(input.orderNo, input.queryToken);
}
