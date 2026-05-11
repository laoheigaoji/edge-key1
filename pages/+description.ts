import type { PageContextServer } from "vike/types";

export default function description(pageContext: any) {
  // 优先使用页面级别的 description，否则使用站点配置的副标题
  return pageContext.description || pageContext.site?.siteSubtitle || "自动发卡系统";
}