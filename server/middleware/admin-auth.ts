import type { Context, Next } from "hono";

export async function adminAuthMiddleware(_c: Context, next: Next) {
  await next();
}
