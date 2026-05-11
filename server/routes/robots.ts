import type { Hono } from "hono";

export function registerRobotsRoutes(app: Hono) {
  app.get("/robots.txt", (c) => {
    const origin = new URL(c.req.url).origin;

    let robotsTxt = `User-agent: *
Disallow: /admin
Disallow: /admin/*
Disallow: /api/

# 禁止爬取管理后台页面
# 禁止爬取API端点

Sitemap: ${origin}/sitemap.xml
`;

    return c.text(robotsTxt, 200, {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    });
  });
}
