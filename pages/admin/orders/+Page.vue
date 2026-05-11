<template>
  <section class="card bg-base-100 shadow-sm">
    <div class="card-body space-y-4">
      <h1 class="text-2xl font-bold">订单管理</h1>

      <!-- 搜索筛选 -->
      <div class="flex flex-wrap gap-3 items-center">
        <input v-model="filter.orderNo" class="input input-sm input-bordered w-48" placeholder="订单号" />
        <input v-model="filter.productName" class="input input-sm input-bordered w-40" placeholder="商品名称" />
        <select v-model="filter.paymentProvider" class="select select-sm select-bordered w-36">
          <option value="">全部支付方式</option>
          <option value="EPAY">易支付</option>
          <option value="ALIPAY">支付宝</option>
          <option value="BEPUSDT">BEpusdt</option>
        </select>
        <select v-model="filter.status" class="select select-sm select-bordered w-32">
          <option value="">全部状态</option>
          <option value="PENDING">待支付</option>
          <option value="PAID">已支付</option>
          <option value="DELIVERED">已发货</option>
          <option value="CLOSED">已关闭</option><option value="FAILED">失败</option>
        </select>
        <input v-model="filter.startDate" type="date" class="input input-sm input-bordered w-40" />
        <input v-model="filter.endDate" type="date" class="input input-sm input-bordered w-40" />
        <AppButton size="sm" variant="primary" @click="handleSearch">搜索</AppButton>
        <AppButton size="sm" variant="ghost" @click="handleReset">重置</AppButton>
      </div>

      <DataTable
        :columns="columns"
        :rows="orderPage.items"
        :total="orderPage.total"
        :page="currentPage"
        :page-size="PAGE_SIZE"
        @update:page="fetchPage"
      >
        <template #amount="{ value }">{{ formatCents(value) }}</template>
        <template #paymentProvider="{ value }">{{ getPaymentProviderLabel(value) }}</template>
        <template #status="{ row }">
          <div class="flex flex-wrap gap-1">
            <StatusTag :type="getOrderStatusType(row.status)">{{ getOrderStatusLabel(row.status) }}</StatusTag>
            <StatusTag :type="getPaymentStatusType(row.paymentStatus)">{{ getPaymentStatusLabel(row.paymentStatus) }}</StatusTag>
            <StatusTag :type="getDeliveryStatusType(row.deliveryStatus)">{{ getDeliveryStatusLabel(row.deliveryStatus) }}</StatusTag>
          </div>
        </template>
        <template #createdAt="{ value }">{{ new Date(value).toLocaleString() }}</template>
        <template #actions="{ row }">
          <AppButton :href="`/admin/orders/${row.id}`" size="xs" variant="outline">详情</AppButton>
        </template>
      </DataTable>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import AppButton from "../../../components/AppButton.vue";
import { useData } from "vike-vue/useData";
import DataTable from "../../../components/DataTable.vue";
import { formatCents } from "../../../lib/utils/money";
import { getDeliveryStatusLabel, getDeliveryStatusType, getOrderStatusLabel, getOrderStatusType, getPaymentProviderLabel, getPaymentStatusLabel, getPaymentStatusType } from "../../../lib/utils/order-status";
import StatusTag from "../../../components/StatusTag.vue";
import { onQueryOrders } from "./queryOrders.telefunc";
import type { Data } from "./+data";

const { orders } = useData<Data>();

const PAGE_SIZE = 20;
const currentPage = ref(1);
const orderPage = ref(orders);

const filter = reactive({ orderNo: "", productName: "", paymentProvider: "", status: "", startDate: "", endDate: "" });

const columns = [
  { key: "orderNo", label: "订单号" },
  { key: "productName", label: "商品" },
  { key: "amount", label: "金额" },
  { key: "paymentProvider", label: "支付方式" },
  { key: "status", label: "状态" },
  { key: "createdAt", label: "时间" },
  { key: "actions", label: "操作" },
];

async function fetchPage(page: number) {
  orderPage.value = await onQueryOrders({
    orderNo: filter.orderNo || undefined,
    productName: filter.productName || undefined,
    paymentProvider: filter.paymentProvider || undefined,
    status: filter.status || undefined,
    startDate: filter.startDate || undefined,
    endDate: filter.endDate || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  currentPage.value = page;
}

async function handleSearch() { await fetchPage(1); }

/**
 * 获取订单状态对应的样式类，采用 badge-soft 提升可读性
 */


async function handleReset() {
  filter.orderNo = "";
  filter.productName = "";
  filter.paymentProvider = "";
  filter.status = "";
  filter.startDate = "";
  filter.endDate = "";
  await fetchPage(1);
}
</script>