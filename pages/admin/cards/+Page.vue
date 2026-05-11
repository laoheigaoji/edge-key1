<template>
  <section class="space-y-6">
    <div class="grid gap-4 md:grid-cols-3">
      <article class="card bg-base-100 shadow-sm"><div class="card-body"><div class="text-sm text-base-content/60">总卡密</div><div class="text-3xl font-bold">{{ overview.total }}</div></div></article>
      <article class="card bg-base-100 shadow-sm"><div class="card-body"><div class="text-sm text-base-content/60">可用库存</div><div class="text-3xl font-bold text-success">{{ overview.available }}</div></div></article>
      <article class="card bg-base-100 shadow-sm"><div class="card-body"><div class="text-sm text-base-content/60">已售出</div><div class="text-3xl font-bold text-secondary">{{ overview.sold }}</div></div></article>
    </div>

    <!-- 新增卡密弹窗 -->
    <dialog ref="addModalRef" class="modal">
      <div class="modal-box space-y-3">
        <form method="dialog"><button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button></form>
        <h3 class="text-lg font-bold">新增卡密</h3>
        <select v-model="singleForm.productId" class="select select-bordered w-full">
          <option value="">请选择商品</option>
          <option v-for="product in products" :key="product.id" :value="String(product.id)">{{ product.name }}</option>
        </select>
        <input v-model="singleForm.batchNo" class="input input-bordered w-full" placeholder="批次号（可选）" />
        <textarea v-model="singleForm.content" class="textarea textarea-bordered w-full" rows="4" placeholder="输入卡密内容"></textarea>
        <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>
        <div class="modal-action">
          <AppButton variant="primary" @click="handleCreateCard">新增卡密</AppButton>
          <form method="dialog"><button class="btn btn-ghost">取消</button></form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- 批量导入弹窗 -->
    <dialog ref="importModalRef" class="modal">
      <div class="modal-box space-y-3">
        <form method="dialog"><button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button></form>
        <h3 class="text-lg font-bold">批量导入</h3>
        <select v-model="importForm.productId" class="select select-bordered w-full">
          <option value="">请选择商品</option>
          <option v-for="product in products" :key="product.id" :value="String(product.id)">{{ product.name }}</option>
        </select>
        <input v-model="importForm.batchNo" class="input input-bordered w-full" placeholder="批次号（可选）" />
        <textarea v-model="importForm.lines" class="textarea textarea-bordered w-full" rows="8" placeholder="每行一条卡密"></textarea>
        <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>
        <div class="modal-action">
          <AppButton variant="primary" @click="handleImportCards">导入卡密</AppButton>
          <form method="dialog"><button class="btn btn-ghost">取消</button></form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <section class="card bg-base-100 shadow-sm">
      <div class="card-body space-y-4">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-xl font-bold">库存列表</h2>
          <div class="flex gap-2">
            <AppButton size="sm" variant="primary" @click="addModalRef?.showModal()">新增卡密</AppButton>
            <AppButton size="sm" variant="outline" @click="importModalRef?.showModal()">批量导入</AppButton>
            <AppButton size="sm" variant="danger" @click="handleDeleteUnused">清空未售库存</AppButton>
          </div>
        </div>
        <p v-if="message" class="text-sm text-base-content/70">{{ message }}</p>

        <!-- 搜索筛选 -->
        <div class="flex flex-wrap gap-3 items-center">
          <select v-model="filter.productId" class="select select-sm select-bordered w-46">
            <option value="">全部商品</option>
            <option v-for="product in products" :key="product.id" :value="String(product.id)">{{ product.name }}</option>
          </select>
          <select v-model="filter.status" class="select select-sm select-bordered w-auto">
            <option value="">全部状态</option>
            <option value="UNUSED">未售出</option>
            <option value="SOLD">已售出</option>
            <option value="LOCKED">锁定中</option>
            <option value="INVALID">已失效</option>
          </select>
          <input v-model="filter.batchNo" class="input input-sm input-bordered w-52" placeholder="批次号" />
          <input v-model="filter.startDate" type="date" class="input input-sm input-bordered w-46" />
          <input v-model="filter.endDate" type="date" class="input input-sm input-bordered w-46" />
        </div>
        <div class="flex gap-3">
          <AppButton size="sm" variant="primary" @click="handleSearch">搜索</AppButton>
          <AppButton size="sm" variant="ghost" @click="handleReset">重置</AppButton>
        </div>

        <DataTable
          :columns="columns"
          :rows="cardPage.items"
          :total="cardPage.total"
          :page="currentPage"
          :page-size="PAGE_SIZE"
          @update:page="handlePageChange"
        >
          <template #contentPreview="{ value }">
            <code>{{ value }}</code>
          </template>
          <template #status="{ value }">
            <StatusTag :type="getCardStatusType(value)">{{ getStatusLabel(value) }}</StatusTag>
          </template>
          <template #createdAt="{ value }">
            {{ formatDate(value) }}
          </template>
          <template #actions="{ row }">
            <AppButton v-if="row.status === 'UNUSED'" size="xs" variant="danger" @click="handleDeleteCard(row.id)">删除</AppButton>
          </template>
        </DataTable>
      </div>
    </section>
  </section>
  <!-- 确认弹窗 -->
  <ConfirmDialog ref="confirmRef" />
</template>

<script setup lang="ts">
import { reactive, ref, useTemplateRef } from "vue";
import { useData } from "vike-vue/useData";
import { normalizeTelefuncError } from "../../../lib/app-error";
import ConfirmDialog from "../../../components/ConfirmDialog.vue";
import { onCreateCard } from "./createCard.telefunc";
import { onDeleteUnusedCards } from "./deleteUnusedCards.telefunc";
import { onImportCards } from "./importCards.telefunc";
import { onQueryCards } from "./queryCards.telefunc";
import { onDeleteCard } from "./deleteCard.telefunc";
import DataTable from "../../../components/DataTable.vue";
import StatusTag from "../../../components/StatusTag.vue";
import AppButton from "../../../components/AppButton.vue";
import type { Data } from "./+data";

const { cards, products, overview } = useData<Data>();

const PAGE_SIZE = 20;
const currentPage = ref(1);
const cardPage = ref({ items: [...cards], total: cards.length });

const addModalRef = useTemplateRef<HTMLDialogElement>("addModalRef");
const importModalRef = useTemplateRef<HTMLDialogElement>("importModalRef");
const confirmRef = useTemplateRef<InstanceType<typeof ConfirmDialog>>("confirmRef");
const message = ref("");
const errorMessage = ref("");

const filter = reactive({ productId: "", batchNo: "", status: "", startDate: "", endDate: "" });

const singleForm = reactive({ productId: "", content: "", batchNo: "" });
const importForm = reactive({ productId: "", lines: "", batchNo: "" });

const columns = [
  { key: "id", label: "ID" },
  { key: "productName", label: "商品" },
  { key: "contentPreview", label: "卡密预览" },
  { key: "batchNo", label: "批次" },
  { key: "status", label: "状态" },
  { key: "orderId", label: "订单" },
  { key: "createdAt", label: "创建时间" },
  { key: "actions", label: "操作" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function getStatusLabel(status: string) {
  return ({ UNUSED: "未售出", SOLD: "已售出", LOCKED: "锁定中", INVALID: "已失效" } as Record<string, string>)[status] || status;
}

function getCardStatusType(status: string): "success" | "default" | "warning" | "danger" {
  return ({ UNUSED: "success", SOLD: "default", LOCKED: "warning", INVALID: "danger" } as Record<string, "success" | "default" | "warning" | "danger">)[status] ?? "default";
}

async function fetchPage(page: number) {
  const result = await onQueryCards({
    productId: filter.productId ? Number(filter.productId) : undefined,
    batchNo: filter.batchNo || undefined,
    status: filter.status || undefined,
    startDate: filter.startDate || undefined,
    endDate: filter.endDate || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  cardPage.value = result;
  currentPage.value = page;
}

async function handleSearch() {
  await fetchPage(1);
}

async function handleReset() {
  filter.productId = "";
  filter.batchNo = "";
  filter.status = "";
  filter.startDate = "";
  filter.endDate = "";
  await fetchPage(1);
}

async function handlePageChange(page: number) {
  await fetchPage(page);
}

async function handleCreateCard() {
  message.value = "";
  errorMessage.value = "";
  try {
    const result = await onCreateCard({
      productId: Number(singleForm.productId),
      content: singleForm.content,
      batchNo: singleForm.batchNo,
    });
    // 检查是否需要确认重复卡密
    if (result && typeof result === 'object' && 'requiresConfirmation' in result && result.requiresConfirmation) {
      const ok = await confirmRef.value?.confirm({
        title: "卡密重复",
        message: result.message,
        confirmText: "继续添加",
      });
      if (!ok) return;
      // 用户确认后，强制添加
      await onCreateCard({
        productId: Number(singleForm.productId),
        content: singleForm.content,
        batchNo: singleForm.batchNo,
        force: true,
      });
    }
    singleForm.content = "";
    singleForm.batchNo = "";
    addModalRef.value?.close();
    message.value = "新增成功";
    await fetchPage(1);
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "新增失败");
  }
}

async function handleImportCards() {
  message.value = "";
  errorMessage.value = "";
  try {
    let result = await onImportCards({
      productId: Number(importForm.productId),
      lines: importForm.lines,
      batchNo: importForm.batchNo,
    });
    // Step 1: 检查输入编辑框是否有重复项目
    if (result && typeof result === 'object' && 'requiresConfirmation' in result && result.requiresConfirmation && result.type === 'input_duplicates') {
      const ok = await confirmRef.value?.confirm({
        title: "输入重复",
        message: result.message,
        confirmText: "删除重复",
      });
      if (ok) {
        // 点击"删除重复" → 回显去重内容到编辑框，停止
        importForm.lines = result.items.join('\n');
        return;
      }
      // 点击"取消" → 跳过输入去重，继续检查数据库重复
      result = await onImportCards({
        productId: Number(importForm.productId),
        lines: importForm.lines,
        batchNo: importForm.batchNo,
        skipInputDedup: true,
      });
    }

    // Step 2: 检查数据库是否有重复卡密
    if (result && typeof result === 'object' && 'requiresConfirmation' in result && result.requiresConfirmation && result.type === 'db_duplicates') {
      const ok = await confirmRef.value?.confirm({
        title: "卡密重复",
        message: result.message,
        confirmText: "继续添加",
      });
      if (!ok) return;
      // 点击"继续添加" → 强制导入
      result = await onImportCards({
        productId: Number(importForm.productId),
        lines: importForm.lines,
        batchNo: importForm.batchNo,
        skipInputDedup: true,
        force: true,
      });
    }
    importForm.lines = "";
    importForm.batchNo = "";
    importModalRef.value?.close();
    message.value = `已导入 ${result.count} 条卡密`;
    await fetchPage(1);
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "导入失败");
  }
}

async function handleDeleteCard(id: number) {
  const ok = await confirmRef.value?.confirm({ title: "删除卡密", message: `确认删除卡密 #${id}？此操作不可撤销。`, confirmText: "删除", danger: true });
  if (!ok) return;
  message.value = "";
  errorMessage.value = "";
  try {
    await onDeleteCard({ id });
    message.value = `已删除卡密 #${id}`;
    await fetchPage(currentPage.value);
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "删除失败");
  }
}

async function handleDeleteUnused() {
  if (!filter.productId) {
    await confirmRef.value?.alert({ title: "提示", message: "请先在筛选区选择商品" });
    return;
  }
  const product = products.find(p => String(p.id) === filter.productId);
  const ok = await confirmRef.value?.confirm({ title: "清空未售库存", message: `确认清空「${product?.name ?? filter.productId}」所有未售卡密？此操作不可撤销。`, confirmText: "清空", danger: true });
  if (!ok) return;
  message.value = "";
  errorMessage.value = "";
  try {
    const result = await onDeleteUnusedCards({ productId: Number(filter.productId) });
    message.value = `已删除 ${result.count} 条未售卡密`;
    await fetchPage(currentPage.value);
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "删除失败");
  }
}
</script>