import { getPrismaForD1 } from "./prisma-factory";
import { autoCloseExpiredOrders } from "../modules/order/service";
import { logger } from "../lib/logger";

/**
 * Cloudflare Workers Cron Trigger 入口
 *
 * 由 wrangler.jsonc 中的 triggers.crons 配置触发，每 5 分钟执行一次。
 * 职责：调用 autoCloseExpiredOrders 关闭超时未支付的订单。
 *
 * 注意：Cron 触发时没有 HTTP 请求上下文，logger 中的
 * getRequestContext() 会返回 null，日志不会包含
 * requestId / method / path 等字段，这是正常的。
 */
export async function scheduled(
  _controller: ScheduledController,
  env: { DB?: D1Database },
  _ctx: ExecutionContext,
) {
  const database = env.DB;
  if (!database) {
    logger.error("cron.auto_close.missing_db_binding");
    return;
  }

  const prisma = getPrismaForD1(database);

  try {
    const count = await autoCloseExpiredOrders(prisma);
    logger.info("cron.auto_close.completed", { closedCount: count });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : String(error),
      { event: "cron.auto_close.failed" },
    );
  }
}
