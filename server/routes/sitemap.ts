import type { Hono } from "hono";
import type { PrismaClient } from "../../generated/prisma/client";
import { logger } from "../../lib/logger";

export function registerSitemapRoutes(app: Hono) {
  app.get("/sitemap.xml", async (c) => {
    const origin = new URL(c.req.url).origin;

    // 静态页面
    const staticPages = [
      { loc: `${origin}/`, changefreq: "daily", priority: "1.0" },
      { loc: `${origin}/query`, changefreq: "weekly", priority: "0.5" },
    ];

    // 尝试从数据库查询上架商品，失败时降级为仅静态页面
    let productPages: { loc: string; changefreq: string; priority: string }[] = [];
    try {
      const universalContext = (c as any).get("universalContext") as { prisma: PrismaClient } | undefined;
      const prisma = universalContext?.prisma;
      if (prisma) {
        const products = await prisma.product.findMany({
          where: { status: "ACTIVE" },
          select: { slug: true },
          orderBy: { sort: "asc" },
        });
        productPages = products.map((p) => ({
          loc: `${origin}/product/${p.slug}`,
          changefreq: "weekly",
          priority: "0.8",
        }));
      }
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        event: "sitemap.products_query_failed",
        source: "sitemap",
      });
      // 降级：仅使用静态页面，不影响网站运行
    }

    const allPages = [...staticPages, ...productPages];

    const urlEntries = allPages
      .map(
        (page) => `  <url>
    <loc>${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
      )
      .join("\n");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    return c.text(sitemap, 200, {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400",
    });
  });
}
