<template>
  <dialog class="modal" :class="{ 'modal-open': show }">
    <div class="modal-box w-11/12 max-w-5xl max-h-[80vh] flex flex-col">
      <h3 class="font-bold text-lg mb-4">选择文件</h3>
      
      <!-- 搜索和筛选 -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <div class="form-control flex-1 min-w-[200px]">
          <input
            type="text"
            v-model="keyword"
            placeholder="搜索文件名..."
            class="input input-bordered input-sm w-full"
          />
        </div>
        
        <select
          v-model="typeFilter"
          class="select select-bordered select-sm"
        >
          <option value="">全部类型</option>
          <option value="image/">图片</option>
          <option value="video/">视频</option>
          <option value="audio/">音频</option>
          <option value="application/pdf">PDF</option>
        </select>
        
        <div class="text-sm text-base-content/60">
          共 {{ total }} 个文件
        </div>
        
        <button class="btn btn-ghost btn-sm" title="刷新" @click="refreshFiles">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <!-- 文件网格 -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
        
        <div v-else-if="files.length === 0" class="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-base-content/50">暂无文件</p>
          <p class="text-sm text-base-content/40 mt-1">请先上传文件</p>
          <a href="/admin/media" target="_blank" class="btn btn-primary btn-sm mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            前往文件管理上传
          </a>
        </div>
        
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div
            v-for="item in files"
            :key="item.id"
            class="group relative card bg-base-200 hover:shadow-md transition-all cursor-pointer overflow-hidden"
            @click="selectFile(item)"
          >
            <!-- 缩略图 / 图标 -->
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
            
            <!-- 信息叠加层 -->
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
              <p class="text-white text-xs font-medium truncate">{{ item.originalName }}</p>
              <p class="text-white/70 text-xs">{{ formatSize(item.fileSize) }}</p>
            </div>
            
            <!-- 选择按钮 -->
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="btn btn-xs btn-circle btn-primary bg-primary/80 hover:bg-primary text-white"
                title="选择此文件"
                @click.stop="selectFile(item)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div v-if="totalPages > 1" class="flex justify-center mt-4">
        <div class="join">
          <button
            class="join-item btn btn-sm"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            &laquo;
          </button>
          <button class="join-item btn btn-sm">第 {{ currentPage }} / {{ totalPages }} 页</button>
          <button
            class="join-item btn btn-sm"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            &raquo;
          </button>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="modal-action">
        <a href="/admin/media" class="btn btn-outline btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          上传文件
        </a>
        <button class="btn btn-outline btn-sm" @click="$emit('close')">取消</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>关闭</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { onGetMediaList } from "../pages/admin/media/getMediaList.telefunc";
import type { MediaItem } from "../modules/media/types";

const props = defineProps<{
  show: boolean;
  typeFilter?: string; // 预设的类型筛选，如 'image/'
}>();

const emit = defineEmits<{
  close: [];
  select: [url: string];
}>();

const keyword = ref("");
const typeFilter = ref(props.typeFilter || "");
const files = ref<MediaItem[]>([]);
const total = ref(0);
const totalPages = ref(0);
const currentPage = ref(1);
const loading = ref(false);

// 监听预设的类型筛选变化
watch(
  () => props.typeFilter,
  (newType) => {
    typeFilter.value = newType || "";
    currentPage.value = 1;
    refreshFiles();
  }
);

// 组件挂载时加载文件（配合 v-if 使用，每次打开都是新实例）
onMounted(() => {
  refreshFiles();
});

// 监听弹窗显示状态，当显示时加载文件（无 v-if 时使用）
watch(
  () => props.show,
  (show) => {
    if (show) {
      currentPage.value = 1;
      refreshFiles();
    }
  },
);

async function refreshFiles() {
  loading.value = true;
  try {
    const result = await onGetMediaList({
      keyword: keyword.value || undefined,
      mimeType: typeFilter.value || undefined,
      page: currentPage.value,
      pageSize: 24,
    });
    files.value = result.items;
    total.value = result.total;
    totalPages.value = result.totalPages;
  } catch (error) {
    console.error("加载文件失败:", error);
    files.value = [];
    total.value = 0;
    totalPages.value = 0;
  } finally {
    loading.value = false;
  }
}

// 搜索防抖
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(keyword, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    refreshFiles();
  }, 300);
});

watch(typeFilter, () => {
  currentPage.value = 1;
  refreshFiles();
});

function goToPage(page: number) {
  currentPage.value = page;
  refreshFiles();
}

function selectFile(item: MediaItem) {
  emit("select", item.url);
  emit("close");
}

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