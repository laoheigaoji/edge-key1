export interface S3ConfigInput {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region?: string;
  publicDomain?: string;
  pathPrefix?: string;
  cacheControl?: string;
}

export interface MediaListFilters {
  mimeType?: string;
  path?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface MediaListResult {
  items: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MediaItem {
  id: number;
  originalName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  fileKey: string;
  url: string;
  thumbnailUrl: string | null;
  path: string | null;
  metadata: string | null;
  uploadedBy: number;
  uploadedAt: string;
}

export interface UploadResult {
  media: MediaItem;
  message: string;
}

// Browser-renderable MIME types
export const RENDERABLE_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/ico",
  // Videos
  "video/mp4",
  "video/webm",
  "video/ogg",
  // Audio
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  // Documents
  "application/pdf",
]);

export function isRenderableMimeType(mimeType: string): boolean {
  return RENDERABLE_MIME_TYPES.has(mimeType);
}

export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "图片";
  if (mimeType.startsWith("video/")) return "视频";
  if (mimeType.startsWith("audio/")) return "音频";
  if (mimeType === "application/pdf") return "PDF";
  return "文件";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
