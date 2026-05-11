const STORAGE_KEY = "local_orders";

export type LocalOrder = {
  orderNo: string;
  queryToken: string;
  productName: string;
  amount: number;
  createdAt: string;
  paymentStatus?: string;
};

export function getLocalOrders(): LocalOrder[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveLocalOrder(order: LocalOrder) {
  const orders = getLocalOrders().filter((o) => o.orderNo !== order.orderNo);
  orders.unshift(order);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(0, 50)));
}
