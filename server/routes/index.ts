import type { Hono } from "hono";
import { registerHealthRoutes } from "./health";
import { registerBepusdtRoutes } from "./payment-bepusdt";
import { registerEpayRoutes } from "./payment-epay";
import { registerAlipayRoutes } from "./payment-alipay";
import { registerStripeRoutes } from "./payment-stripe";
import { registerRobotsRoutes } from "./robots";
import { registerSitemapRoutes } from "./sitemap";
import { registerMediaRoutes } from "./media";

// 集中注册所有 `/api/*` 路由，避免入口文件散落多个 register 调用。
export function registerApiRoutes(app: Hono) {
  registerHealthRoutes(app);
  registerBepusdtRoutes(app);
  registerEpayRoutes(app);
  registerAlipayRoutes(app);
  registerStripeRoutes(app);
  registerRobotsRoutes(app);
  registerSitemapRoutes(app);
  registerMediaRoutes(app);
}

