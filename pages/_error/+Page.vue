<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200 px-4">
    <div class="text-center space-y-4">
      <div class="text-8xl font-black text-base-content/10">{{ is404 ? '404' : '500' }}</div>
      <h1 class="text-2xl font-bold text-base-content">{{ heading }}</h1>
      <p class="text-base-content/60">{{ message }}</p>
      <AppButton href="/" variant="primary">返回首页</AppButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { usePageContext } from "vike-vue/usePageContext";
import AppButton from "../../components/AppButton.vue";

const pageContext = usePageContext();
const { is404, abortReason } = pageContext;
const heading = is404 ? "页面不存在" : "服务器错误";
const message = abortReason ?? (is404 ? "你访问的页面不存在或已被删除。" : "服务器发生了一些错误，请稍后再试。");
</script>