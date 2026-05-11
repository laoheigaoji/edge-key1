import type { PageContextServer } from "vike/types";

export default function title(pageContext: any) {
  // 优先使用页面级别的 title（如果某个页面配置了 title），否则使用站点配置的名称
  return pageContext.title || pageContext.site?.siteName;
}