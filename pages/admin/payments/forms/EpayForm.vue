<template>
  <div class="grid gap-4 md:grid-cols-2">
    <label class="flex flex-col gap-1.5">
      <span class="label-text font-medium">PID</span>
      <input v-model="modelValue.pid" class="input input-bordered w-full" />
    </label>
    <label class="flex flex-col gap-1.5">
      <span class="label-text font-medium">Key</span>
      <SecretInput v-model="modelValue.key" />
    </label>
  </div>
  <p class="text-xs text-base-content/60">
    `Notify URL` 和 `Return URL` 支持填写相对路径或完整 URL；`Return URL` 支持 `{orderNo}`、`{token}` 占位符。
  </p>
</template>

<script setup lang="ts">
import SecretInput from "../../../../components/SecretInput.vue";
defineProps<{ modelValue: Record<string, any> }>();
</script>