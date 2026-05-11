export function generateOrderNo() {
  return `ORD${Date.now()}`;
}

export function generateQueryToken() {
  return crypto.randomUUID().replace(/-/g, "");
}
