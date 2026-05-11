import { AwsClient } from "aws4fetch";

export interface S3ClientConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region?: string;
  publicDomain?: string;
  pathPrefix?: string;
  cacheControl?: string;
}

/**
 * 根据 S3 响应状态码生成用户友好的错误信息
 */
function s3ErrorMessage(status: number, operation: string, rawText?: string): string {
  switch (status) {
    case 400:
      return `S3 ${operation}失败 (400)：请求参数错误。请检查端点地址和存储桶名称格式是否正确。`;
    case 403:
      return `S3 ${operation}失败 (403)：认证失败或权限不足。请检查 Access Key ID 和 Secret Access Key 是否正确，以及密钥是否拥有该存储桶的读写权限。`;
    case 404:
      return `S3 ${operation}失败 (404)：存储桶或资源不存在。请检查存储桶名称是否正确，以及存储桶所在的区域是否与端点匹配。`;
    case 405:
      return `S3 ${operation}失败 (405)：操作不被允许。请检查端点地址是否正确，部分存储服务对端点格式有特殊要求。`;
    case 429:
      return `S3 ${operation}失败 (429)：请求过于频繁，已被限流。请稍后重试。`;
    case 500:
    case 502:
    case 503:
      return `S3 ${operation}失败 (${status})：存储服务暂时不可用。请稍后重试。如果持续出现此错误，请检查存储服务状态。`;
    default:
      return `S3 ${operation}失败 (${status})：${rawText || "未知错误"}。请检查 S3 配置是否正确。`;
  }
}

export class S3Client {
  private client: AwsClient;
  private config: S3ClientConfig;

  constructor(config: S3ClientConfig) {
    this.config = config;
    this.client = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      service: "s3",
      region: config.region || "auto",
    });
  }

  /**
   * Build the full S3 URL for a given key
   */
  private buildUrl(key: string): string {
    const endpoint = this.config.endpoint.replace(/\/$/, "");
    const bucket = this.config.bucketName;

    // Virtual-hosted-style: bucket already in hostname
    // e.g., https://v50-free.s3.us-west-004.backblazeb2.com
    // URL: https://v50-free.s3.us-west-004.backblazeb2.com/key
    if (endpoint.includes(`://${bucket}.`)) {
      return `${endpoint}/${key}`;
    }

    // Path-style: https://s3.amazonaws.com/bucket/key
    return `${endpoint}/${bucket}/${key}`;
  }

  /**
   * Build the public URL for accessing a file
   */
  buildPublicUrl(key: string): string {
    if (this.config.publicDomain) {
      const domain = this.config.publicDomain.replace(/\/$/, "");
      return `${domain}/${key}`;
    }
    return this.buildUrl(key);
  }

  /**
   * Build the full key with optional path prefix
   */
  buildKey(filename: string, path?: string): string {
    const prefix = this.config.pathPrefix?.replace(/^\/|\/$/g, "") || "";
    const dir = path?.replace(/^\/|\/$/g, "") || "";

    let key = "";
    if (prefix) key += prefix + "/";
    if (dir) key += dir + "/";
    key += filename;

    return key;
  }

  /**
   * Test S3 connectivity and permissions
   * Attempts to list objects (max 1) to verify credentials and bucket access
   */
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    const endpoint = this.config.endpoint.replace(/\/$/, "");
    const bucket = this.config.bucketName;

    // Build list-objects URL
    let listUrl: string;
    if (endpoint.includes(`://${bucket}.`)) {
      listUrl = `${endpoint}/?list-type=2&max-keys=1`;
    } else {
      listUrl = `${endpoint}/${bucket}/?list-type=2&max-keys=1`;
    }

    try {
      const response = await this.client.fetch(listUrl, { method: "GET" });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        return { ok: false, message: s3ErrorMessage(response.status, "连接测试", text) };
      }

      return { ok: true, message: `连接成功！存储桶「${bucket}」可正常访问。` };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("ENOTFOUND")) {
        return { ok: false, message: `S3 连接测试失败：无法连接到 ${endpoint}。请检查端点地址是否正确，以及网络连接是否正常。` };
      }
      return { ok: false, message: `S3 连接测试失败：${msg}` };
    }
  }

  /**
   * Upload a file to S3
   */
  async putObject(key: string, body: ArrayBuffer | Uint8Array | string, contentType: string): Promise<Response> {
    const url = this.buildUrl(key);

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": this.config.cacheControl || "public, max-age=31536000, immutable",
    };

    let response: Response;
    try {
      response = await this.client.fetch(url, {
        method: "PUT",
        headers,
        body: typeof body === "string" ? body : body as any,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("ENOTFOUND")) {
        throw new Error(`S3 上传失败：无法连接到存储服务。请检查端点地址是否正确，以及网络连接是否正常。`);
      }
      throw new Error(`S3 上传失败：${msg}`);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(s3ErrorMessage(response.status, "上传", text));
    }

    return response;
  }

  /**
   * Get an object from S3 (for proxying)
   */
  async getObject(key: string): Promise<Response> {
    const url = this.buildUrl(key);

    let response: Response;
    try {
      response = await this.client.fetch(url, { method: "GET" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("ENOTFOUND")) {
        throw new Error(`S3 获取文件失败：无法连接到存储服务。请检查端点地址是否正确，以及网络连接是否正常。`);
      }
      throw new Error(`S3 获取文件失败：${msg}`);
    }

    return response;
  }

  /**
   * Delete an object from S3
   */
  async deleteObject(key: string): Promise<void> {
    const url = this.buildUrl(key);

    let response: Response;
    try {
      response = await this.client.fetch(url, { method: "DELETE" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("ENOTFOUND")) {
        throw new Error(`S3 删除失败：无法连接到存储服务。请检查端点地址是否正确，以及网络连接是否正常。`);
      }
      throw new Error(`S3 删除失败：${msg}`);
    }

    // 404 is expected for idempotent delete (file already gone), silently ignore
    if (response.status === 404) {
      return;
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(s3ErrorMessage(response.status, "删除", text));
    }
  }

  /**
   * Check if an object exists (HEAD request)
   */
  async headObject(key: string): Promise<{ exists: boolean; contentType?: string; contentLength?: number }> {
    const url = this.buildUrl(key);

    let response: Response;
    try {
      response = await this.client.fetch(url, { method: "HEAD" });
    } catch {
      return { exists: false };
    }

    // 404 means file does not exist
    if (response.status === 404) {
      return { exists: false };
    }

    // Other non-OK responses are real errors, not "not found"
    if (!response.ok) {
      throw new Error(s3ErrorMessage(response.status, "查询"));
    }

    return {
      exists: true,
      contentType: response.headers.get("Content-Type") || undefined,
      contentLength: response.headers.get("Content-Length")
        ? parseInt(response.headers.get("Content-Length")!, 10)
        : undefined,
    };
  }
}

/**
 * Create an S3Client from a database config record
 */
export function createS3ClientFromConfig(config: {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region?: string | null;
  publicDomain?: string | null;
  pathPrefix?: string | null;
  cacheControl?: string | null;
}): S3Client {
  return new S3Client({
    endpoint: config.endpoint,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    bucketName: config.bucketName,
    region: config.region || "auto",
    publicDomain: config.publicDomain || undefined,
    pathPrefix: config.pathPrefix || undefined,
    cacheControl: config.cacheControl || "public, max-age=31536000, immutable",
  });
}
