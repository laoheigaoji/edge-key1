import type { Hono } from "hono";
import type { PrismaClient } from "../../generated/prisma/client";
import { handlePaymentNotify } from "../../modules/payment/service";
import { logger } from "../../lib/logger";

export function registerBepusdtRoutes(app: Hono) {
  app.post("/api/payments/bepusdt/notify", async (c) => {
    try {
      const payload = await c.req.json<Record<string, string>>();
      const universalContext = (c as any).get("universalContext") as { prisma: PrismaClient };
      if (!universalContext?.prisma) {
        logger.error("Missing prisma for bepusdt notify", {
          event: "payment.notify.context_missing",
          provider: "BEPUSDT",
          source: "notify",
          payload,
        });
        return c.text("fail", 500);
      }
      const result = await handlePaymentNotify("BEPUSDT", payload, universalContext.prisma, "notify");
      return c.text(result.ok ? "success" : "fail");
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        event: "payment.notify.route_exception",
        provider: "BEPUSDT",
        source: "notify",
      });
      return c.text("fail", 400);
    }
  });
}
