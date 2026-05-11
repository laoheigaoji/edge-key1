<template>
  <div class="space-y-3">
    <div class="overflow-x-auto overflow-y-auto max-h-150">
      <table class="table table-zebra w-full">
        <thead class="sticky top-0 z-10 bg-base-200">
          <tr>
            <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td :colspan="columns.length" class="text-center text-base-content/60">{{ emptyText }}</td>
          </tr>
          <tr v-for="(row, i) in rows" :key="i">
            <td v-for="col in columns" :key="col.key">
              <slot :name="col.key" :row="row" :value="row[col.key]">{{ row[col.key] ?? '-' }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="total > pageSize" class="flex items-center justify-between">
      <span class="text-sm text-base-content/60">共 {{ total }} 条，第 {{ page }}/{{ totalPages }} 页</span>
      <div class="join">
        <button class="join-item btn btn-sm" :disabled="page <= 1" @click="$emit('update:page', page - 1)">«</button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          class="join-item btn btn-sm"
          :class="{ 'btn-active': p === page }"
          @click="$emit('update:page', p)"
        >{{ p }}</button>
        <button class="join-item btn btn-sm" :disabled="page >= totalPages" @click="$emit('update:page', page + 1)">»</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from "vue";

const props = withDefaults(defineProps<{
  columns: { key: string; label: string }[];
  rows: T[];
  total: number;
  page: number;
  pageSize?: number;
  emptyText?: string;
}>(), {
  pageSize: 20,
  emptyText: "暂无数据",
});

defineEmits<{ "update:page": [page: number] }>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

const pageNumbers = computed(() => {
  const pages: number[] = [];
  const start = Math.max(1, props.page - 2);
  const end = Math.min(totalPages.value, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});
</script>