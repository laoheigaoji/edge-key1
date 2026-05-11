<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
    <div
      v-for="item in items"
      :key="item.id"
      class="group relative card bg-base-200 hover:shadow-md transition-all cursor-pointer overflow-hidden"
      @click="$emit('preview', item)"
    >
      <!-- Thumbnail / Icon -->
      <div class="aspect-square flex items-center justify-center p-4 overflow-hidden">
        <img
          v-if="isImage(item.mimeType)"
          :src="item.url"
          :alt="item.originalName"
          class="w-full h-full object-cover rounded"
          loading="lazy"
        />
        <video
          v-else-if="isVideo(item.mimeType)"
          :src="item.url"
          class="w-full h-full object-cover rounded"
          preload="metadata"
          muted
        />
        <div v-else class="text-center">
          <svg v-if="isPdf(item.mimeType)" xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-xs text-base-content/50 mt-1 uppercase">{{ getExtension(item.originalName) }}</p>
        </div>
      </div>

      <!-- Info Overlay -->
      <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
        <p class="text-white text-xs font-medium truncate">{{ item.originalName }}</p>
        <p class="text-white/70 text-xs">{{ formatSize(item.fileSize) }}</p>
      </div>

      <!-- Action Buttons -->
      <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          class="btn btn-xs btn-circle btn-ghost bg-white/80 hover:bg-white text-base-content"
          title="复制 URL"
          @click.stop="$emit('copy-url', item.url)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          class="btn btn-xs btn-circle btn-ghost bg-error/80 hover:bg-error text-white"
          title="删除"
          @click.stop="$emit('delete', item)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MediaItem } from "../../../../modules/media/types";

defineProps<{
  items: MediaItem[];
}>();

defineEmits<{
  preview: [item: MediaItem];
  delete: [item: MediaItem];
  "copy-url": [url: string];
}>();

function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

function isPdf(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

function getExtension(filename: string): string {
  const ext = filename.split(".").pop();
  return ext ? ext.toUpperCase() : "";
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
</script>
