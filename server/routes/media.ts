import type { Hono } from "hono";
import { getPrismaForD1 } from "../prisma-factory";
import { getSession, createAuthjsConfig } from "../authjs-handler";
import { handleUpload } from "../../modules/media/service";
import { getMediaByKey } from "../../modules/media/repository";
import { getS3ConfigRecord } from "../../modules/media/repository";
import { createS3ClientFromConfig } from "../../lib/s3/client";
import { toErrorResponsePayload } from "../../lib/app-error";
import { logger } from "../../lib/logger";

export function registerMediaRoutes(app: Hono) {
  /**
   * POST /api/media/upload
   * File upload endpoint using multipart form data
   * Requires admin authentication (checked via Auth.js session)
   */
  app.post("/api/media/upload", async (c) => {
    try {
      const database = (c.env as { DB?: D1Database } | undefined)?.DB;
      if (!database) {
        return c.json({ message: "数据库绑定缺失", code: "D1_BINDING_MISSING" }, 500);
      }
      const prisma = getPrismaForD1(database);

      // Verify admin session using Auth.js
      const authConfig = createAuthjsConfig(prisma);
      const session = await getSession(c.req.raw, authConfig);

      if (!session?.user || (session.user as any).role !== "admin") {
        return c.json({ message: "请先登录管理员账号", code: "UNAUTHORIZED" }, 401);
      }

      const adminId = Number(session.user.id);
      if (!Number.isFinite(adminId) || adminId <= 0) {
        return c.json({ message: "会话无效", code: "INVALID_SESSION" }, 401);
      }

      // Parse multipart form data
      const formData = await c.req.formData();
      const file = formData.get("file") as File | null;
      const path = (formData.get("path") as string) || undefined;

      if (!file) {
        return c.json({ message: "请选择要上传的文件", code: "FILE_REQUIRED" }, 400);
      }

      // Upload file
      const media = await handleUpload(prisma, adminId, file, path);

      return c.json({
        success: true,
        message: "文件上传成功",
        data: media,
      });
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        event: "media.upload.failed",
      });
      const payload = toErrorResponsePayload(error);
      return c.json(payload, payload.statusCode as any);
    }
  });

  /**
   * GET /api/media/proxy/*
   * Proxy media file from S3 through Worker domain
   * Adds Cache-Control headers for Cloudflare caching
   * This endpoint is public - no auth required (files are served publicly)
   */
  app.get("/api/media/proxy/*", async (c) => {
    try {
      const database = (c.env as { DB?: D1Database } | undefined)?.DB;
      if (!database) {
        return c.json({ message: "数据库绑定缺失", code: "D1_BINDING_MISSING" }, 500);
      }
      const prisma = getPrismaForD1(database);

      // Extract the key from the URL path
      const fullPath = c.req.path;
      const keyPrefix = "/api/media/proxy/";
      const fileKey = fullPath.substring(fullPath.indexOf(keyPrefix) + keyPrefix.length);

      if (!fileKey) {
        return c.json({ message: "文件路径无效", code: "INVALID_KEY" }, 400);
      }

      // Look up the media record
      const media = await getMediaByKey(prisma, fileKey);
      if (!media) {
        return c.json({ message: "文件不存在", code: "NOT_FOUND" }, 404);
      }

      // Get S3 config
      const s3Config = await getS3ConfigRecord(prisma);
      if (!s3Config) {
        return c.json({ message: "S3 配置缺失", code: "S3_CONFIG_MISSING" }, 500);
      }

      // Fetch from S3
      const s3Client = createS3ClientFromConfig(s3Config);
      const s3Response = await s3Client.getObject(fileKey);

      if (!s3Response.ok) {
        if (s3Response.status === 404) {
          return c.json({ message: "文件不存在于存储中", code: "S3_NOT_FOUND" }, 404);
        }
        return c.json({ message: "获取文件失败", code: "S3_ERROR" }, 502);
      }

      // Build response with Cache-Control header
      const headers = new Headers();
      headers.set("Content-Type", media.mimeType);
      headers.set("Cache-Control", s3Config.cacheControl || "public, max-age=31536000, immutable");
      headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(media.originalName)}"`);

      const contentLength = s3Response.headers.get("Content-Length");
      if (contentLength) {
        headers.set("Content-Length", contentLength);
      }
      const etag = s3Response.headers.get("ETag");
      if (etag) {
        headers.set("ETag", etag);
      }

      return new Response(s3Response.body, {
        status: 200,
        headers,
      });
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        event: "media.proxy.failed",
      });
      return c.json({ message: "获取文件失败", code: "INTERNAL_ERROR" }, 500);
    }
  });
}
