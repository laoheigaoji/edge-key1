<template>
  <dialog class="modal modal-open" @click.self="$emit('close')">
    <div class="modal-box max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-base-300">
        <div class="min-w-0 flex-1">
          <h3 class="font-bold text-lg truncate">{{ item.originalName }}</h3>
          <p class="text-sm text-base-content/60">
            {{ getFileCategory(item.mimeType) }} · {{ formatSize(item.fileSize) }}
          </p>
        </div>
        <div class="flex items-center gap-2 ml-4">
          <button class="btn btn-sm btn-ghost" title="复制 URL" @click="$emit('copy-url', item.url)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            复制 URL
          </button>
          <button class="btn btn-sm btn-ghost" @click="$emit('close')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Preview Content -->
      <div class="flex items-center justify-center bg-base-300 min-h-[300px] max-h-[calc(90vh-180px)] overflow-auto p-4">
        <img
          v-if="isImage(item.mimeType)"
          :src="item.url"
          :alt="item.originalName"
          class="max-w-full max-h-full object-contain"
        />
        <video
          v-else-if="isVideo(item.mimeType)"
          :src="item.url"
          controls
          class="max-w-full max-h-full"
        >
          您的浏览器不支持视频播放
        </video>
        <audio
          v-else-if="isAudio(item.mimeType)"
          :src="item.url"
          controls
          class="w-full max-w-md"
        >
          您的浏览器不支持音频播放
        </audio>
        <iframe
          v-else-if="isPdf(item.mimeType)"
          :src="item.url"
          class="w-full h-full min-h-[500px]"
        ></iframe>
        <div v-else class="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-base-content/50">此文件类型无法预览</p>
          <a :href="item.url" target="_blank" class="btn btn-primary btn-sm mt-4">在新标签页打开</a>
        </div>
      </div>

      <!-- Details Footer -->
      <div class="p-4 border-t border-base-300 bg-base-100">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-base-content/50">类型</span>
            <p class="font-medium">{{ item.mimeType }}</p>
          </div>
          <div>
            <span class="text-base-content/50">大小</span>
            <p class="font-medium">{{ formatSize(item.fileSize) }}</p>
          </div>
          <div>
            <span class="text-base-content/50">上传时间</span>
            <p class="font-medium">{{ formatDate(item.uploadedAt) }}</p>
          </div>
          <div>
            <span class="text-base-content/50">存储路径</span>
            <p class="font-medium truncate">{{ item.path || '根目录' }}</p>
          </div>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="$emit('close')">关闭</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import type { MediaItem } from "../../../../modules/media/types";

defineProps<{
  item: MediaItem;
}>();

defineEmits<{
  close: [];
  "copy-url": [url: string];
}>();

function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

function isAudio(mimeType: string): boolean {
  return mimeType.startsWith("audio/");
}

function isPdf(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "图片";
  if (mimeType.startsWith("video/")) return "视频";
  if (mimeType.startsWith("audio/")) return "音频";
  if (mimeType === "application/pdf") return "PDF";
  return "文件";
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>
