<template>
  <section class="card bg-base-100 shadow-sm">
    <div class="card-body space-y-4">
      <div>
        <h1 class="text-2xl font-bold">分类管理</h1>
        <p class="text-sm text-base-content/70">管理前台商品分类、排序和启用状态。</p>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1.2fr_2fr]">
        <section class="rounded-box border border-base-300 p-4">
          <h2 class="mb-3 text-lg font-semibold">{{ form.id ? `编辑 #${form.id}` : "新增分类" }}</h2>
          <div class="space-y-3">
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">名称</span>
              <input v-model="form.name" class="input input-bordered w-full" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">Slug</span>
              <input v-model="form.slug" class="input input-bordered w-full" placeholder="留空则自动生成" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">描述</span>
              <textarea v-model="form.description" class="textarea textarea-bordered w-full" rows="3"></textarea>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">排序</span>
              <input v-model.number="form.sort" type="number" class="input input-bordered w-full" />
            </label>
            <div class="flex items-center gap-3">
              <AppButton variant="primary" size="sm" :loading="saving" @click="handleSave">保存分类</AppButton>
              <AppButton variant="ghost" size="sm" @click="resetForm">重置</AppButton>
            </div>
            <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>
          </div>
        </section>

        <section>
          <DataTable
            :columns="columns"
            :rows="categoryList"
            :total="categoryList.length"
            :page="1"
            :page-size="categoryList.length || 1"
            empty-text="当前还没有分类，先创建第一条。"
          >
            <template #name="{ row }">
              <div class="font-medium">{{ row.name }}</div>
              <div v-if="row.description" class="text-xs text-base-content/60">{{ row.description }}</div>
            </template>
            <template #status="{ row }">
              <StatusTag :type="row.status === 'ACTIVE' ? 'success' : 'default'">
                {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
              </StatusTag>
            </template>
            <template #actions="{ row }">
              <div class="flex gap-2">
                <AppButton size="xs" variant="outline" @click="startEdit(row)">编辑</AppButton>
                <AppButton size="xs" variant="outline" @click="handleToggle(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</AppButton>
                <AppButton size="xs" variant="danger" @click="handleDelete(row)">删除</AppButton>
              </div>
            </template>
          </DataTable>
        </section>
      </div>
    </div>
  </section>
  <ConfirmDialog ref="confirmRef" />
</template>

<script setup lang="ts">
import { normalizeTelefuncError } from "../../../lib/app-error";
import { reactive, ref, useTemplateRef } from "vue";
import ConfirmDialog from "../../../components/ConfirmDialog.vue";
import AppButton from "../../../components/AppButton.vue";
import DataTable from "../../../components/DataTable.vue";
import { useData } from "vike-vue/useData";
import StatusTag from "../../../components/StatusTag.vue";
import { onDeleteCategory } from "./deleteCategory.telefunc";
import { onSaveCategory } from "./saveCategory.telefunc";
import { onToggleCategory } from "./toggleCategory.telefunc";
import type { Data } from "./+data";

const { categories } = useData<Data>();

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "名称" },
  { key: "slug", label: "Slug" },
  { key: "sort", label: "排序" },
  { key: "status", label: "状态" },
  { key: "actions", label: "操作" },
];

const categoryList = ref([...categories]);
const saving = ref(false);
const errorMessage = ref("");
const confirmRef = useTemplateRef<InstanceType<typeof ConfirmDialog>>("confirmRef");

const form = reactive({
  id: undefined as number | undefined,
  name: "",
  slug: "",
  description: "",
  sort: 0,
});

function resetForm() {
  form.id = undefined;
  form.name = "";
  form.slug = "";
  form.description = "";
  form.sort = 0;
  errorMessage.value = "";
}

function startEdit(category: (typeof categories)[number]) {
  form.id = category.id;
  form.name = category.name;
  form.slug = category.slug;
  form.description = category.description ?? "";
  form.sort = category.sort;
  errorMessage.value = "";
}

async function handleSave() {
  saving.value = true;
  errorMessage.value = "";

  try {
    const result = await onSaveCategory({
      id: form.id,
      name: form.name,
      slug: form.slug,
      description: form.description,
      sort: form.sort,
    });

    const index = categoryList.value.findIndex((item) => item.id === result.id);
    if (index >= 0) {
      categoryList.value[index] = result;
    } else {
      categoryList.value.unshift(result);
    }

    categoryList.value = [...categoryList.value].sort((left, right) => {
      if (left.sort !== right.sort) return left.sort - right.sort;
      return right.id - left.id;
    });

    resetForm();
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleToggle(category: (typeof categories)[number]) {
  const nextStatus = category.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
  const result = await onToggleCategory({
    id: category.id,
    status: nextStatus,
  });

  categoryList.value = categoryList.value.map((item) => {
    if (item.id !== result.id) return item;
    return {
      ...item,
      status: result.status,
    };
  });
}

async function handleDelete(category: (typeof categories)[number]) {
  if (!await confirmRef.value?.confirm({ title: "删除分类", message: `确认删除分类"${category.name}"吗？`, confirmText: "删除", danger: true })) {
    return;
  }

  errorMessage.value = "";

  try {
    await onDeleteCategory({ id: category.id });
    categoryList.value = categoryList.value.filter((item) => item.id !== category.id);
    if (form.id === category.id) {
      resetForm();
    }
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "删除失败");
  }
}
</script>
