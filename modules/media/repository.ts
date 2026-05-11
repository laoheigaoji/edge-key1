import type { PrismaClient, Prisma } from "../../generated/prisma/client";
import type { MediaListFilters, MediaListResult, S3ConfigInput } from "./types";

// ─── S3Config ────────────────────────────────────────────

export function getS3ConfigRecord(prisma: PrismaClient) {
  return prisma.s3Config.findUnique({ where: { id: 1 } });
}

export function upsertS3ConfigRecord(prisma: PrismaClient, input: S3ConfigInput) {
  return prisma.s3Config.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      endpoint: input.endpoint,
      accessKeyId: input.accessKeyId,
      secretAccessKey: input.secretAccessKey,
      bucketName: input.bucketName,
      region: input.region || "auto",
      publicDomain: input.publicDomain || null,
      pathPrefix: input.pathPrefix || null,
      cacheControl: input.cacheControl || "public, max-age=31536000, immutable",
    },
    update: {
      endpoint: input.endpoint,
      accessKeyId: input.accessKeyId,
      secretAccessKey: input.secretAccessKey,
      bucketName: input.bucketName,
      region: input.region || "auto",
      publicDomain: input.publicDomain || null,
      pathPrefix: input.pathPrefix || null,
      cacheControl: input.cacheControl || "public, max-age=31536000, immutable",
    },
  });
}

// ─── Media ───────────────────────────────────────────────

export function createMediaRecord(
  prisma: PrismaClient,
  input: {
    originalName: string;
    storedName: string;
    mimeType: string;
    fileSize: number;
    fileKey: string;
    url: string;
    thumbnailUrl?: string | null;
    path?: string | null;
    metadata?: string | null;
    uploadedBy: number;
  },
) {
  return prisma.media.create({
    data: {
      originalName: input.originalName,
      storedName: input.storedName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      fileKey: input.fileKey,
      url: input.url,
      thumbnailUrl: input.thumbnailUrl || null,
      path: input.path || null,
      metadata: input.metadata || null,
      uploadedBy: input.uploadedBy,
    },
  });
}

export function deleteMediaRecord(prisma: PrismaClient, id: number) {
  return prisma.media.delete({ where: { id } });
}

export function getMediaRecord(prisma: PrismaClient, id: number) {
  return prisma.media.findUnique({ where: { id } });
}

export function getMediaByKey(prisma: PrismaClient, fileKey: string) {
  return prisma.media.findUnique({ where: { fileKey } });
}

export async function listMediaRecords(
  prisma: PrismaClient,
  filters: MediaListFilters,
): Promise<MediaListResult> {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize || 24));

  const where: Prisma.MediaWhereInput = {};

  if (filters.mimeType) {
    where.mimeType = { startsWith: filters.mimeType };
  }

  if (filters.path !== undefined) {
    where.path = filters.path || null;
  }

  if (filters.keyword) {
    where.OR = [
      { originalName: { contains: filters.keyword } },
      { storedName: { contains: filters.keyword } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.media.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      originalName: item.originalName,
      storedName: item.storedName,
      mimeType: item.mimeType,
      fileSize: item.fileSize,
      fileKey: item.fileKey,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl,
      path: item.path,
      metadata: item.metadata,
      uploadedBy: item.uploadedBy,
      uploadedAt: item.uploadedAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
