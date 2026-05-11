<template>
  <div class="space-y-6">
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article v-for="metric in metrics" :key="metric.label" class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <div class="text-sm text-base-content/60">{{ metric.label }}</div>
          <div class="text-3xl font-bold">{{ metric.value }}</div>
        </div>
      </article>
    </section>
    <section class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">当前状态</h2>
        <p class="text-sm text-base-content/70">仪表盘已接入真实统计，后续还会继续补操作日志和更多异常处理。</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useData } from "vike-vue/useData";
import type { Data } from "./+data";

const { metrics } = useData<Data>();
</script>
