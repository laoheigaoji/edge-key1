<template>
  <div class="flex flex-wrap items-center gap-3">
    <!-- Search -->
    <div class="form-control flex-1 min-w-[200px]">
      <div class="input-group">
        <input
          type="text"
          :value="keyword"
          placeholder="搜索文件名..."
          class="input input-bordered input-sm w-full"
          @input="$emit('update:keyword', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- Type Filter -->
    <select
      class="select select-bordered select-sm"
      :value="typeFilter"
      @change="$emit('update:type-filter', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">全部类型</option>
      <option value="image/">图片</option>
      <option value="video/">视频</option>
      <option value="audio/">音频</option>
      <option value="application/pdf">PDF</option>
    </select>

    <!-- Stats -->
    <div class="text-sm text-base-content/60">
      共 {{ total }} 个文件
    </div>

    <!-- Refresh -->
    <button class="btn btn-ghost btn-sm" title="刷新" @click="$emit('refresh')">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  keyword: string;
  typeFilter: string;
  total: number;
}>();

defineEmits<{
  "update:keyword": [value: string];
  "update:type-filter": [value: string];
  refresh: [];
}>();
</script>
