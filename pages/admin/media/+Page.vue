<template>
  <div class="space-y-6">
    <!-- Header -->
    <section class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <h1 class="text-2xl font-bold">文件管理</h1>
            <p class="text-sm text-base-content/70">管理上传到 S3 存储的文件资源。</p>
          </div>
          <div class="flex items-center gap-2">
            <AppButton variant="outline" size="sm" @click="showS3Config = true">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              S3 配置
            </AppButton>
          </div>
        </div>
      </div>
    </section>

    <!-- No S3 Config Warning -->
    <div v-if="!s3Config" class="alert alert-warning">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
      <div>
        <h3 class="font-bold">尚未配置 S3 存储</h3>
        <p class="text-sm">请先配置 S3 兼容存储服务（如 Cloudflare R2、AWS S3 等）才能使用文件管理功能。</p>
      </div>
      <AppButton variant="primary" size="sm" @click="showS3Config = true">立即配置</AppButton>
    </div>

    <!-- Upload Area -->
    <section v-if="s3Config" class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <MediaUploader
          :uploading="uploading"
          :upload-progress="uploadProgress"
          :upload-error="uploadError"
          :status-text="uploadStatusText"
          @upload="handleUpload"
          @clear-error="uploadError = ''"
        />
      </div>
    </section>

    <!-- Filters & Search -->
    <section v-if="s3Config" class="card bg-base-100 shadow-sm">
      <div class="card-body py-3">
        <MediaFilters
          :keyword="filterKeyword"
          :type-filter="filterType"
          :total="mediaList.total"
          @update:keyword="handleKeywordChange"
          @update:type-filter="handleTypeFilterChange"
          @refresh="refreshMediaList"
        />
      </div>
    </section>

    <!-- Media Grid -->
    <section v-if="s3Config" class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="mediaList.items.length === 0" class="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p class="text-base-content/50">暂无文件</p>
          <p class="text-sm text-base-content/40 mt-1">上传文件后将在此处显示</p>
        </div>

        <MediaGrid
          v-else
          :items="mediaList.items"
          @preview="handlePreview"
          @delete="handleDelete"
          @copy-url="handleCopyUrl"
        />

        <!-- Pagination -->
        <div v-if="mediaList.totalPages > 1" class="flex justify-center mt-6">
          <div class="join">
            <button
              class="join-item btn btn-sm"
              :disabled="currentPage <= 1"
              @click="goToPage(currentPage - 1)"
            >
            &laquo;
            </button>
            <button class="join-item btn btn-sm">第 {{ currentPage }} / {{ mediaList.totalPages }} 页</button>
            <button
              class="join-item btn btn-sm"
              :disabled="currentPage >= mediaList.totalPages"
              @click="goToPage(currentPage + 1)"
            >
            &raquo;
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Preview Modal -->
    <MediaPreview
      v-if="previewItem"
      :item="previewItem"
      @close="previewItem = null"
      @copy-url="handleCopyUrl"
    />

    <!-- S3 Config Modal -->
    <S3ConfigModal
      v-if="showS3Config"
      :config="s3Config"
      :saving="savingConfig"
      :error="configError"
      @close="showS3Config = false"
      @save="handleSaveConfig"
    />

    <!-- Toast -->
    <div class="toast toast-end">
      <div v-if="toastMessage" class="alert" :class="toastType === 'success' ? 'alert-success' : 'alert-error'">
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useData } from "vike-vue/useData";
import AppButton from "../../../components/AppButton.vue";
import MediaUploader from "./components/MediaUploader.vue";
import MediaGrid from "./components/MediaGrid.vue";
import MediaPreview from "./components/MediaPreview.vue";
import MediaFilters from "./components/MediaFilters.vue";
import S3ConfigModal from "./components/S3ConfigModal.vue";
import { normalizeTelefuncError } from "../../../lib/app-error";
import { onGetMediaList } from "./getMediaList.telefunc";
import { onDeleteMedia } from "./deleteMedia.telefunc";
import { onSaveS3Config } from "./saveS3Config.telefunc";
import type { Data } from "./+data";
import type { MediaItem, S3ConfigInput, MediaListResult } from "../../../modules/media/types";

const initialData = useData<Awaited<Data>>();

// State
const s3Config = ref(initialData.s3Config);
const mediaList = ref<MediaListResult>(initialData.mediaList);
const loading = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadError = ref("");
const uploadStatusText = ref("");
const previewItem = ref<MediaItem | null>(null);
const showS3Config = ref(false);
const savingConfig = ref(false);
const configError = ref("");
const filterKeyword = ref("");
const filterType = ref("");
const currentPage = ref(1);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");

// Functions
function showToast(message: string, type: "success" | "error" = "success") {
  toastMessage.value = message;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = "";
  }, 3000);
}

async function refreshMediaList() {
  loading.value = true;
  try {
    const result = await onGetMediaList({
      keyword: filterKeyword.value || undefined,
      mimeType: filterType.value || undefined,
      page: currentPage.value,
      pageSize: 24,
    });
    mediaList.value = result;
  } catch (error) {
    showToast(normalizeTelefuncError(error, "加载失败"), "error");
  } finally {
    loading.value = false;
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
function handleKeywordChange(keyword: string) {
  filterKeyword.value = keyword;
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    refreshMediaList();
  }, 300);
}

function handleTypeFilterChange(type: string) {
  filterType.value = type;
  currentPage.value = 1;
  refreshMediaList();
}

function goToPage(page: number) {
  currentPage.value = page;
  refreshMediaList();
}

/**
 * 判断文件是否可以转换为 WebP
 */
function isConvertibleImage(file: File): boolean {
  const convertibleTypes = ["image/jpeg", "image/png", "image/bmp"];
  return convertibleTypes.includes(file.type);
}

/**
 * 使用浏览器 Canvas API 将图片转换为 WebP 格式
 */
async function convertToWebP(file: File, quality: number = 0.7): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("无法创建 Canvas 上下文"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("WebP 转换失败"));
            return;
          }
          const webpName = file.name.replace(/\.[^.]+$/, ".webp");
          resolve(new File([blob], webpName, { type: "image/webp" }));
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片加载失败"));
    };

    img.src = url;
  });
}

async function handleUpload(file: File, compress: boolean) {
  if (!s3Config.value) return;

  uploading.value = true;
  uploadProgress.value = 0;
  uploadError.value = "";

  try {
    let uploadFile = file;

    // 如果启用压缩且为可转换的图片格式，先转为 WebP
    if (compress && isConvertibleImage(file)) {
      uploadStatusText.value = "正在压缩为 WebP...";
      uploadProgress.value = 0;
      try {
        uploadFile = await convertToWebP(file);
      } catch (err) {
        console.warn("WebP 压缩失败，使用原始文件上传:", err);
        // 压缩失败时降级使用原始文件
      }
    }

    uploadStatusText.value = "正在上传...";
    const formData = new FormData();
    formData.append("file", uploadFile);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media/upload");

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        uploadProgress.value = Math.round((e.loaded / e.total) * 100);
      }
    });

    const response = await new Promise<{ success: boolean; data: MediaItem; message: string }>((resolve, reject) => {
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new Error(data.message || "上传失败"));
          }
        } catch {
          reject(new Error("上传失败"));
        }
      };
      xhr.onerror = () => reject(new Error("网络错误"));
      xhr.send(formData);
    });

    const originalSize = file.size;
    const uploadedSize = uploadFile.size;
    if (compress && isConvertibleImage(file) && uploadedSize < originalSize) {
      const saved = Math.round((1 - uploadedSize / originalSize) * 100);
      showToast(`文件上传成功 (WebP 压缩节省 ${saved}%)`);
    } else {
      showToast("文件上传成功");
    }
    // Add to list
    mediaList.value.items.unshift(response.data);
    mediaList.value.total += 1;
  } catch (error) {
    uploadError.value = normalizeTelefuncError(error, "上传失败");
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
    uploadStatusText.value = "";
  }
}

async function handleDelete(item: MediaItem) {
  if (!confirm(`确定要删除「${item.originalName}」吗？此操作不可恢复。`)) return;

  try {
    await onDeleteMedia(item.id);
    showToast("文件已删除");
    mediaList.value.items = mediaList.value.items.filter((i) => i.id !== item.id);
    mediaList.value.total -= 1;
    if (previewItem.value?.id === item.id) {
      previewItem.value = null;
    }
  } catch (error) {
    showToast(normalizeTelefuncError(error, "删除失败"), "error");
  }
}

function handlePreview(item: MediaItem) {
  previewItem.value = item;
}

function handleCopyUrl(url: string) {
  navigator.clipboard.writeText(url).then(() => {
    showToast("URL 已复制到剪贴板");
  }).catch(() => {
    showToast("复制失败，请手动复制", "error");
  });
}

async function handleSaveConfig(input: S3ConfigInput) {
  savingConfig.value = true;
  configError.value = "";

  try {
    const result = await onSaveS3Config(input);
    s3Config.value = result;
    showS3Config.value = false;
    showToast("S3 配置已保存");
    // Refresh media list after config change
    refreshMediaList();
  } catch (error) {
    configError.value = normalizeTelefuncError(error, "保存失败");
  } finally {
    savingConfig.value = false;
  }
}
</script>
