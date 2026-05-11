import type { Hono } from "hono";
import type { PrismaClient } from "../../generated/prisma/client";
import { handlePaymentNotify } from "../../modules/payment/service";
import { logger } from "../../lib/logger";

function normalizePayload(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, Array.isArray(value) ? String(value[0]) : String(value)]),
  );
}

export function registerEpayRoutes(app: Hono) {
  app.on(["GET", "POST"], "/api/payments/epay/notify", async (c) => {
    let payload: Record<string, string> = {};
    try {
      payload =
        c.req.method === "GET"
          ? normalizePayload(Object.fromEntries(new URL(c.req.url).searchParams.entries()))
          : normalizePayload(await c.req.parseBody());
      const universalContext = (c as any).get("universalContext") as { prisma: PrismaClient };
      if (!universalContext?.prisma) {
        logger.error("Missing prisma for epay notify", {
          event: "payment.notify.context_missing",
          provider: "EPAY",
          source: "notify",
          payload,
        });
        return c.text("fail", 500);
      }
      const result = await handlePaymentNotify("EPAY", payload, universalContext.prisma, "notify");
      return c.text(result.ok ? "success" : "fail");
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        event: "payment.notify.route_exception",
        provider: "EPAY",
        source: "notify",
        payload,
      });
      return c.text("fail", 400);
    }
  });
}
