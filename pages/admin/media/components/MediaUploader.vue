<template>
  <div>
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
      :class="{
        'border-primary bg-primary/5': isDragging,
        'border-base-300 hover:border-primary/50': !isDragging && !uploading,
        'border-base-300 opacity-60 pointer-events-none': uploading,
      }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <div v-if="uploading" class="space-y-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <div>
          <p class="font-medium">{{ statusText || '正在上传...' }}</p>
          <div class="w-full max-w-xs mx-auto mt-3">
            <progress class="progress progress-primary w-full" :value="uploadProgress" max="100"></progress>
            <p class="text-sm text-base-content/60 mt-1">{{ uploadProgress }}%</p>
          </div>
        </div>
      </div>

      <div v-else class="space-y-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div>
          <p class="font-medium">拖拽文件到此处，或</p>
          <label class="btn btn-primary btn-sm mt-2 cursor-pointer">
            选择文件
            <input type="file" class="hidden" @change="handleFileSelect" />
          </label>
        </div>
        <label
          class="flex items-center justify-center gap-2"
          :class="webpSupported ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'"
        >
          <input
            type="checkbox"
            v-model="compressWebp"
            :disabled="!webpSupported"
            class="checkbox checkbox-primary checkbox-sm"
          />
          <span class="text-sm text-base-content/70">图片自动压缩为WebP</span>
        </label>
        <p v-if="!webpSupported" class="text-xs text-warning">当前浏览器环境不支持 WebP 压缩</p>
        <p class="text-xs text-base-content/50">支持上传图片、视频、音频、PDF 等格式文件</p>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="uploadError" class="alert alert-error mt-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div class="flex-1">
        <p class="text-sm whitespace-pre-wrap">{{ uploadError }}</p>
      </div>
      <button class="btn btn-ghost btn-xs" @click="$emit('clear-error')">关闭</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

defineProps<{
  uploading: boolean;
  uploadProgress: number;
  uploadError: string;
  statusText?: string;
}>();

const emit = defineEmits<{
  upload: [file: File, compress: boolean];
  "clear-error": [];
}>();

const isDragging = ref(false);

// 能力检测：浏览器是否支持 WebP 编码（只读）
const webpSupported = ref(false);

// 用户选择：是否启用压缩（可变，默认跟随浏览器能力）
const compressWebp = ref(false);

// 挂载后在客户端检测，避免 SSR 下 document 不存在
onMounted(() => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    webpSupported.value = canvas.toDataURL("image/webp").startsWith("data:image/webp");
    compressWebp.value = webpSupported.value;
  } catch {
    webpSupported.value = false;
  }
});

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    emit("upload", files[0], compressWebp.value);
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    emit("upload", input.files[0], compressWebp.value);
    input.value = "";
  }
}
</script>
