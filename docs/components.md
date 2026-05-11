# 公共组件文档

## AppButton

统一按钮组件，替代项目中散落的原生 `<button class="btn ...">`，解决尺寸混乱、loading 状态不一致、缺少 `type` 属性等问题。支持 `href` prop 渲染为 `<a>` 标签。

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `"primary" \| "success" \| "danger" \| "warning" \| "ghost" \| "outline" \| "default"` | `"default"` | 颜色风格 |
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"sm"` | 尺寸，**通过此 prop 控制大小，不要用 class** |
| `loading` | `boolean` | `false` | 显示左侧旋转 SVG，同时自动禁用按钮 |
| `disabled` | `boolean` | `false` | 禁用按钮 |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | 原生 type，默认 `button` 防止误触发表单提交 |
| `block` | `boolean` | `false` | 宽度撑满父容器 |
| `href` | `string` | — | 有值时渲染为 `<a>` 标签，用于页面跳转 |

### 尺寸规范

| size | 高度 | 适用场景 |
|------|------|----------|
| `xs` | 1.5rem | 表格行内操作（编辑、删除） |
| `sm` | 2.25rem | **默认**，工具栏、表单、弹窗操作 |
| `md` | 2.5rem | 较大的表单提交按钮 |
| `lg` | 3rem | 页面主 CTA |

### 颜色规范

| variant | 颜色 | 适用场景 |
|---------|------|----------|
| `primary` | 蓝色 | 主要操作、保存、提交 |
| `success` | 绿色 | 成功、激活 |
| `danger` | 红色 | 删除、危险操作 |
| `warning` | 橙色 | 警告操作 |
| `outline` | 蓝色边框 | 次要操作、编辑 |
| `ghost` | 透明 | 取消、重置 |
| `default` | 灰色边框 | 中性操作 |

### 基本用法

```components/AppButton.vue#L1-3
<AppButton variant="primary" @click="handleSave">保存</AppButton>
<AppButton variant="danger" size="xs" @click="handleDelete">删除</AppButton>
<AppButton variant="ghost" @click="handleCancel">取消</AppButton>
```

### 链接按钮（href）

```components/AppButton.vue#L1-3
<AppButton href="/admin/products/new" variant="primary">新建商品</AppButton>
<AppButton :href="`/admin/orders/${id}`" variant="outline" size="xs">详情</AppButton>
```

### loading 状态

```components/AppButton.vue#L1-3
<AppButton variant="primary" :loading="saving" @click="handleSave">保存配置</AppButton>
```

loading 为 `true` 时，按钮左侧显示旋转圆圈动画，按钮自动进入禁用状态，无需额外绑定 `:disabled="saving"`。

### 表单提交

```components/AppButton.vue#L1-3
<AppButton type="submit" variant="primary" :loading="loading" block>登录后台</AppButton>
```



## ConfirmDialog

全局确认/提示弹窗组件，替代原生 `confirm()` 和 `alert()`，基于 daisyUI `<dialog>`。

### 暴露方法

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `confirm(options)` | 见下表 | `Promise<boolean>` | 确认弹窗，有确认+取消按钮 |
| `alert(options)` | `title`, `message`, `confirmText?` | `Promise<void>` | 提示弹窗，只有"知道了"按钮 |

#### confirm options

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | — | 弹窗标题 |
| `message` | `string` | — | 弹窗内容 |
| `confirmText` | `string` | `"确认"` | 确认按钮文字 |
| `cancelText` | `string` | `"取消"` | 取消按钮文字 |
| `danger` | `boolean` | `false` | 确认按钮显示为红色（危险操作） |

### 基本用法

```components/ConfirmDialog.vue#L1-5
<ConfirmDialog ref="confirmRef" />
```

```components/ConfirmDialog.vue#L1-10
const confirmRef = useTemplateRef<InstanceType<typeof ConfirmDialog>>("confirmRef");

// 确认弹窗（危险操作）
const ok = await confirmRef.value?.confirm({
  title: "删除",
  message: "确认删除？此操作不可撤销。",
  confirmText: "删除",
  danger: true,
});
if (!ok) return;

// 提示弹窗
await confirmRef.value?.alert({ title: "提示", message: "请先选择商品" });
```


## StatusTag

状态标签组件，用于展示订单状态、支付状态、发货状态等。

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `"primary" \| "success" \| "danger" \| "warning" \| "default"` | `"default"` | 颜色类型 |
| `size` | `"sm" \| "md" \| "lg"` | `"sm"` | 大小 |
| `variant` | `"solid" \| "outline" \| "pill"` | `"solid"` | 样式风格 |

### 颜色对应

| type | 颜色 | 适用场景 |
|------|------|----------|
| `primary` | 蓝色 | 主要操作、信息 |
| `success` | 绿色 | 已完成、已支付、已发货 |
| `danger` | 红色 | 失败、错误 |
| `warning` | 橙色 | 待处理、未支付、未发货 |
| `default` | 灰色 | 已关闭、中性状态 |

### 基本用法

```components/StatusTag.vue#L1-3
<StatusTag type="success">已支付</StatusTag>
<StatusTag type="warning">待处理</StatusTag>
<StatusTag type="danger">发货失败</StatusTag>
```

### 配合 order-status 工具函数

`lib/utils/order-status.ts` 提供了对应的 type 辅助函数：

- `getOrderStatusType(status)` — 订单状态 → type
- `getPaymentStatusType(status)` — 支付状态 → type
- `getDeliveryStatusType(status)` — 发货状态 → type

```components/StatusTag.vue#L1-5
<StatusTag :type="getOrderStatusType(order.status)">
  {{ getOrderStatusLabel(order.status) }}
</StatusTag>
```


## SecretInput

带显示/隐藏切换的密钥输入框，用于密码、API Secret 等敏感字段。

### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | `string` | 输入值（v-model） |

支持透传所有原生 `input` 属性（如 `placeholder`、`disabled` 等）。

### 基本用法

```components/SecretInput.vue#L1-3
<SecretInput v-model="form.appSecret" placeholder="请输入 App Secret" />
```


## DataTable

通用带翻页的表格组件，基于 daisyUI `table` 样式。

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `columns` | `{ key: string; label: string }[]` | — | 列定义 |
| `rows` | `T[]` | — | 当前页数据 |
| `total` | `number` | — | 总条数 |
| `page` | `number` | — | 当前页码（从 1 开始） |
| `pageSize` | `number` | `20` | 每页条数 |
| `emptyText` | `string` | `"暂无数据"` | 空状态文案 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:page` | `page: number` | 用户切换页码时触发 |

### Slots

每一列都有一个以 `col.key` 命名的具名插槽，用于自定义单元格渲染。

插槽 props：

| 名称 | 类型 | 说明 |
|------|------|------|
| `row` | `T` | 当前行完整数据 |
| `value` | `any` | 当前列的值，等同于 `row[col.key]` |

不提供插槽时，默认渲染 `value`，值为 `null`/`undefined` 时显示 `-`。

### 基本用法

```components/DataTable.vue#L1-5
<DataTable
  :columns="columns"
  :rows="pageData.items"
  :total="pageData.total"
  :page="currentPage"
  :page-size="20"
  @update:page="handlePageChange"
/>
```

### 自定义列渲染

```components/DataTable.vue#L1-10
<DataTable :columns="columns" :rows="rows" :total="total" :page="page" @update:page="p => page = p">
  <!-- 自定义状态列 -->
  <template #status="{ value }">
    <span class="badge badge-success">{{ value }}</span>
  </template>
  <!-- 自定义时间列 -->
  <template #createdAt="{ value }">
    {{ new Date(value).toLocaleString() }}
  </template>
</DataTable>
```

### 完整示例

```pages/admin/cards/+Page.vue#L1-30
<script setup lang="ts">
import { ref, reactive } from "vue";
import DataTable from "../../../components/DataTable.vue";
import { onQueryCards } from "./queryCards.telefunc";

const PAGE_SIZE = 20;
const currentPage = ref(1);
const cardPage = ref({ items: [], total: 0 });

const columns = [
  { key: "id", label: "ID" },
  { key: "productName", label: "商品" },
  { key: "status", label: "状态" },
  { key: "createdAt", label: "创建时间" },
];

async function fetchPage(page: number) {
  cardPage.value = await onQueryCards({ page, pageSize: PAGE_SIZE });
  currentPage.value = page;
}
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="cardPage.items"
    :total="cardPage.total"
    :page="currentPage"
    :page-size="PAGE_SIZE"
    @update:page="fetchPage"
  />
</template>
```

### 分页说明

- 总条数 `total <= pageSize` 时，分页控件自动隐藏
- 页码按钮最多显示 5 个，以当前页为中心滑动