import type { PageContextServer } from "vike/types";
import { getPublicSiteInfo } from "../modules/site/service";

export async function onBeforeRender(pageContext: PageContextServer) {
  const site = await getPublicSiteInfo(pageContext.prisma);
  return {
    pageContext: {
      site,
      title: site?.siteName || "EK发卡商城",
      description: site?.siteSubtitle || "Cloudflare Workers 免费部署自动发卡商城",
    },
  };
}