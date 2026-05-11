import type { Hono } from "hono";

export function registerHealthRoutes(app: Hono) {
  app.get("/api/health", (c) => c.json({ ok: true }));
}
