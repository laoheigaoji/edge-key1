export async function onPageTransitionEnd() {
  // Vike 的 页面切换生命周期钩子 ，用于在前端路由跳转时执行一些自定义逻辑
  // 结束过渡动画
  document.body.classList.remove("page-transition");
}
