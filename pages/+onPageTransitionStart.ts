// https://vike.dev/onPageTransitionStart

import type { PageContextClient } from "vike/types";

export async function onPageTransitionStart(pageContext: Partial<PageContextClient>) {
  // Vike 的 页面切换生命周期钩子 ，用于在前端路由跳转时执行一些自定义逻辑
  // 开始过渡动画
  document.body.classList.add("page-transition");
}
