import type { Hono } from "hono";
import type { PrismaClient } from "../../generated/prisma/client";
import { handlePaymentNotify } from "../../modules/payment/service";
import { logger } from "../../lib/logger";

export function registerStripeRoutes(app: Hono) {
  app.post("/api/payments/stripe/notify", async (c) => {
    let payload: Record<string, string> = {};
    try {
      const rawBody = await c.req.text();
      const signature = c.req.header("stripe-signature") ?? "";
      payload = {
        __raw_body: rawBody,
        __stripe_signature: signature,
      };
      const universalContext = (c as any).get("universalContext") as { prisma: PrismaClient };
      if (!universalContext?.prisma) {
        logger.error("Missing prisma for stripe notify", {
          event: "payment.notify.context_missing",
          provider: "STRIPE",
          source: "notify",
        });
        return c.text("fail", 500);
      }
      const result = await handlePaymentNotify("STRIPE", payload, universalContext.prisma, "notify");
      return c.text(result.ok ? "success" : "fail");
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        event: "payment.notify.route_exception",
        provider: "STRIPE",
        source: "notify",
      });
      return c.text("fail", 400);
    }
  });
}