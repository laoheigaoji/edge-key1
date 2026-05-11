import { getContext } from "telefunc";
import type { PrismaClient } from "../../generated/prisma/client";
import { badRequestError, notFoundError } from "../../lib/app-error";
import { S3Client, createS3ClientFromConfig } from "../../lib/s3/client";
import { getAdminContext, logAdminOperation } from "../auth/service";
import {
  getS3ConfigRecord,
  upsertS3ConfigRecord,
  createMediaRecord,
  deleteMediaRecord,
  getMediaRecord,
  listMediaRecords,
} from "./repository";
import type { S3ConfigInput, MediaListFilters, MediaListResult, MediaItem } from "./types";

// ─── S3 Config ───────────────────────────────────────────

export async function getS3Config(prisma?: PrismaClient) {
  const client = prisma ?? getContext<{ prisma: PrismaClient }>().prisma;
  const record = await getS3ConfigRecord(client);
  if (!record) return null;

  return {
    id: record.id,
    endpoint: record.endpoint,
    accessKeyId: record.accessKeyId,
    secretAccessKey: record.secretAccessKey,
    bucketName: record.bucketName,
    region: record.region,
    publicDomain: record.publicDomain,
    pathPrefix: record.pathPrefix,
    cacheControl: record.cacheControl,
  };
}

export async function saveS3Config(input: S3ConfigInput) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);

  // Validate input
  if (!input.endpoint?.trim()) throw badRequestError("S3 端点不能为空", "ENDPOINT_REQUIRED");
  if (!input.accessKeyId?.trim()) throw badRequestError("Access Key ID 不能为空", "ACCESS_KEY_REQUIRED");
  if (!input.secretAccessKey?.trim()) throw badRequestError("Secret Access Key 不能为空", "SECRET_KEY_REQUIRED");
  if (!input.bucketName?.trim()) throw badRequestError("存储桶名称不能为空", "BUCKET_REQUIRED");

  // Normalize endpoint: remove trailing slash
  const endpoint = input.endpoint.trim().replace(/\/+$/, "");

  const record = await upsertS3ConfigRecord(prisma, {
    endpoint,
    accessKeyId: input.accessKeyId.trim(),
    secretAccessKey: input.secretAccessKey.trim(),
    bucketName: input.bucketName.trim(),
    region: input.region?.trim() || "auto",
    publicDomain: input.publicDomain?.trim() || undefined,
    pathPrefix: input.pathPrefix?.trim().replace(/^\/|\/$/g, "") || undefined,
    cacheControl: input.cacheControl?.trim() || "public, max-age=31536000, immutable",
  });

  await logAdminOperation(
    {
      action: "SAVE_S3_CONFIG",
      targetType: "S3Config",
      targetId: "1",
      detail: `bucket=${record.bucketName}, endpoint=${record.endpoint}`,
    },
    { prisma, adminId },
  );

  return {
    id: record.id,
    endpoint: record.endpoint,
    accessKeyId: record.accessKeyId,
    secretAccessKey: record.secretAccessKey,
    bucketName: record.bucketName,
    region: record.region,
    publicDomain: record.publicDomain,
    pathPrefix: record.pathPrefix,
    cacheControl: record.cacheControl,
  };
}

// ─── Get S3 Client from DB ───────────────────────────────

export async function getS3Client(prisma: PrismaClient): Promise<S3Client> {
  const config = await getS3ConfigRecord(prisma);
  if (!config) {
    throw badRequestError("请先配置 S3 存储服务", "S3_CONFIG_MISSING");
  }
  return createS3ClientFromConfig(config);
}

export async function testS3Connection(input?: S3ConfigInput) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;

  let s3Client: S3Client;
  if (input) {
    // Test with provided config (from form, not yet saved)
    s3Client = createS3ClientFromConfig(input);
  } else {
    // Test with saved config
    const config = await getS3ConfigRecord(prisma);
    if (!config) {
      throw badRequestError("请先配置 S3 存储服务", "S3_CONFIG_MISSING");
    }
    s3Client = createS3ClientFromConfig(config);
  }

  return s3Client.testConnection();
}

// ─── Media Operations ────────────────────────────────────

export async function listMedia(filters: MediaListFilters): Promise<MediaListResult> {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  return listMediaRecords(prisma, filters);
}

export async function deleteMedia(mediaId: number) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);

  const media = await getMediaRecord(prisma, mediaId);
  if (!media) {
    throw notFoundError("文件不存在", "MEDIA_NOT_FOUND");
  }

  // Delete from S3
  const s3Client = await getS3Client(prisma);
  await s3Client.deleteObject(media.fileKey);

  // Delete from database
  await deleteMediaRecord(prisma, mediaId);

  await logAdminOperation(
    {
      action: "DELETE_MEDIA",
      targetType: "Media",
      targetId: String(mediaId),
      detail: `file=${media.originalName}, key=${media.fileKey}`,
    },
    { prisma, adminId },
  );

  return { success: true, message: `已删除文件: ${media.originalName}` };
}

// ─── Used by HTTP upload route ───────────────────────────

export async function handleUpload(
  prisma: PrismaClient,
  adminId: number,
  file: File,
  path?: string,
): Promise<MediaItem> {
  const s3Client = await getS3Client(prisma);

  // Generate stored name with timestamp and random suffix
  const ext = file.name.includes(".") ? "." + file.name.split(".").pop() : "";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const storedName = `${timestamp}-${random}${ext}`;
  const fileKey = s3Client.buildKey(storedName, path);

  // Read file content
  const arrayBuffer = await file.arrayBuffer();
  const contentType = file.type || "application/octet-stream";

  // Upload to S3
  await s3Client.putObject(fileKey, arrayBuffer, contentType);

  // URL always goes through Worker proxy for Cloudflare caching
  const url = `/api/media/proxy/${fileKey}`;

  // Save to database
  const media = await createMediaRecord(prisma, {
    originalName: file.name,
    storedName,
    mimeType: contentType,
    fileSize: file.size,
    fileKey,
    url,
    path: path || null,
    uploadedBy: adminId,
  });

  await logAdminOperation(
    {
      action: "UPLOAD_MEDIA",
      targetType: "Media",
      targetId: String(media.id),
      detail: `file=${file.name}, size=${file.size}, type=${contentType}`,
    },
    { prisma, adminId },
  );

  return {
    id: media.id,
    originalName: media.originalName,
    storedName: media.storedName,
    mimeType: media.mimeType,
    fileSize: media.fileSize,
    fileKey: media.fileKey,
    url: media.url,
    thumbnailUrl: media.thumbnailUrl,
    path: media.path,
    metadata: media.metadata,
    uploadedBy: media.uploadedBy,
    uploadedAt: media.uploadedAt.toISOString(),
  };
}
