<template>
  <section class="card bg-base-100 shadow-sm">
    <div class="card-body space-y-4">
      <div class="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 class="text-2xl font-bold">商品管理</h1>
          <p class="text-sm text-base-content/70">管理商品价格、分类、上下架状态和购买限制。</p>
        </div>
        <AppButton href="/admin/products/new" variant="primary" size="sm">新建商品</AppButton>
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <input v-model="filter.name" class="input input-sm input-bordered w-48" placeholder="商品名称" />
        <select v-model="filter.status" class="select select-sm select-bordered w-32">
          <option value="">全部状态</option>
          <option value="ACTIVE">上架</option>
          <option value="INACTIVE">下架</option><option value="DRAFT">草稿</option>
        </select>
        <AppButton size="sm" variant="primary" @click="handleSearch">搜索</AppButton>
        <AppButton size="sm" variant="ghost" @click="handleReset">重置</AppButton>
      </div>

      <DataTable
        :columns="columns"
        :rows="pageData.items"
        :total="pageData.total"
        :page="currentPage"
        :page-size="PAGE_SIZE"
        empty-text="当前还没有商品，请先创建第一个商品。"
        @update:page="fetchPage"
      >
        <template #name="{ row }">
          <div class="font-medium">{{ row.name }}</div>
          <div class="text-xs text-base-content/60">{{ row.slug }}</div>
        </template>
        <template #categoryName="{ value }">{{ value || '未分类' }}</template>
        <template #price="{ value }">{{ formatCents(value) }}</template>
        <template #buy="{ row }">{{ row.minBuy }} - {{ row.maxBuy }}</template>
        <template #status="{ row }">
          <StatusTag :type="row.status === 'ACTIVE' ? 'success' : 'default'">
            {{ row.status === 'ACTIVE' ? '上架' : '下架' }}
          </StatusTag>
        </template>
        <template #actions="{ row }">
          <div class="flex gap-2">
            <AppButton :href="`/admin/products/${row.id}/edit`" variant="outline" size="xs">编辑</AppButton>
            <AppButton size="xs" variant="danger" @click="handleDelete(row)">删除</AppButton>
          </div>
        </template>
      </DataTable>
    </div>
  </section>
  <ConfirmDialog ref="confirmRef" />
</template>

<script setup lang="ts">
import { normalizeTelefuncError } from "../../../lib/app-error";
import { ref, reactive, useTemplateRef } from "vue";
import AppButton from "../../../components/AppButton.vue";
import ConfirmDialog from "../../../components/ConfirmDialog.vue";
import DataTable from "../../../components/DataTable.vue";
import StatusTag from "../../../components/StatusTag.vue";
import { useData } from "vike-vue/useData";
import { formatCents } from "../../../lib/utils/money";
import { onDeleteProduct } from "./deleteProduct.telefunc";
import { onQueryProducts } from "./queryProducts.telefunc";
import type { Data } from "./+data";

const { products, total } = useData<Data>();

const PAGE_SIZE = 20;
const currentPage = ref(1);
const pageData = ref({ items: [...products], total });
const filter = reactive({ name: "", status: "" });
const confirmRef = useTemplateRef<InstanceType<typeof ConfirmDialog>>("confirmRef");

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "商品" },
  { key: "categoryName", label: "分类" },
  { key: "price", label: "价格" },
  { key: "buy", label: "限购" },
  { key: "status", label: "状态" },
  { key: "actions", label: "操作" },
];

async function fetchPage(page: number) {
  pageData.value = await onQueryProducts({
    name: filter.name || undefined,
    status: filter.status || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  currentPage.value = page;
}

async function handleSearch() { await fetchPage(1); }

async function handleReset() {
  filter.name = "";
  filter.status = "";
  await fetchPage(1);
}

async function handleDelete(product: (typeof products)[number]) {
  if (!await confirmRef.value?.confirm({ title: "删除商品", message: `确认删除商品"${product.name}"吗？`, confirmText: "删除", danger: true })) return;
  try {
    await onDeleteProduct({ id: product.id });
    await fetchPage(currentPage.value);
  } catch (error) {
    await confirmRef.value?.alert({ title: "错误", message: normalizeTelefuncError(error, "删除失败") });
  }
}
</script>