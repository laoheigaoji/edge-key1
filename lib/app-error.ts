type ErrorDetails = Record<string, unknown>;

export type AppErrorOptions = {
  code?: string;
  statusCode?: number;
  expose?: boolean;
  cause?: unknown;
  details?: ErrorDetails;
};

type TelefuncAbortValue = {
  message?: unknown;
  code?: unknown;
  statusCode?: unknown;
};

export class AppError extends Error {
  code?: string;
  statusCode: number;
  expose: boolean;
  cause?: unknown;
  details?: ErrorDetails;

  constructor(message: string, options?: AppErrorOptions) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "AppError";
    this.code = options?.code;
    this.statusCode = options?.statusCode ?? 400;
    this.expose = options?.expose ?? true;
    this.cause = options?.cause;
    this.details = options?.details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function badRequestError(message: string, code = "BAD_REQUEST", options?: Omit<AppErrorOptions, "code" | "statusCode">) {
  return new AppError(message, { ...options, statusCode: 400, code });
}

export function unauthorizedError(message = "请先登录管理员账号", code = "UNAUTHORIZED", options?: Omit<AppErrorOptions, "code" | "statusCode">) {
  return new AppError(message, { ...options, statusCode: 401, code });
}

export function forbiddenError(message: string, code = "FORBIDDEN", options?: Omit<AppErrorOptions, "code" | "statusCode">) {
  return new AppError(message, { ...options, statusCode: 403, code });
}

export function notFoundError(message: string, code = "NOT_FOUND", options?: Omit<AppErrorOptions, "code" | "statusCode">) {
  return new AppError(message, { ...options, statusCode: 404, code });
}

export function conflictError(message: string, code = "CONFLICT", options?: Omit<AppErrorOptions, "code" | "statusCode">) {
  return new AppError(message, { ...options, statusCode: 409, code });
}

export function rateLimitError(message = "请求过于频繁，请稍后再试", code = "RATE_LIMITED", options?: Omit<AppErrorOptions, "code" | "statusCode">) {
  return new AppError(message, { ...options, statusCode: 429, code });
}

export function externalServiceError(message: string, code = "EXTERNAL_SERVICE_ERROR", options?: Omit<AppErrorOptions, "code" | "statusCode">) {
  return new AppError(message, { ...options, statusCode: 502, code });
}

export function internalServerError(
  message = "服务器开小差了，请稍后重试",
  code = "INTERNAL_SERVER_ERROR",
  options?: Omit<AppErrorOptions, "code" | "statusCode" | "expose">,
) {
  return new AppError(message, { ...options, statusCode: 500, code, expose: false });
}

export function assertCondition(condition: unknown, error: AppError) {
  if (!condition) {
    throw error;
  }
}

export function getErrorMessage(error: unknown, fallbackMessage = "Unknown error") {
  if (typeof error === "string" && error) {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function toAppError(error: unknown, fallback?: AppErrorOptions) {
  if (error instanceof AppError) {
    return error;
  }

  // Prisma 唯一约束冲突
  if (error instanceof Error && (error as any).code === "P2002") {
    return conflictError("数据已存在，请检查是否重复", "UNIQUE_CONSTRAINT");
  }

  // Telefunc 重新包装错误后 instanceof 失效，通过 name 识别
  if (error instanceof Error && error.name === "AppError") {
    const e = error as AppError;
    return new AppError(e.message, {
      code: e.code,
      statusCode: e.statusCode,
      expose: e.expose,
      cause: e.cause,
    });
  }

  const abortValue = getTelefuncAbortValue(error);
  if (abortValue?.message && typeof abortValue.message === "string") {
    return new AppError(abortValue.message, {
      statusCode: typeof abortValue.statusCode === "number" ? abortValue.statusCode : fallback?.statusCode ?? 400,
      code: typeof abortValue.code === "string" ? abortValue.code : fallback?.code,
      expose: fallback?.expose ?? true,
      cause: error,
      details: fallback?.details,
    });
  }

  if (error instanceof Error && error.message === "Unauthorized") {
    return unauthorizedError(undefined, undefined, { cause: error, details: fallback?.details });
  }

  return internalServerError(undefined, fallback?.code, {
    cause: error,
    details: fallback?.details,
  });
}

export function normalizeTelefuncError(error: unknown, fallbackMessage: string) {

  const abortValue = getTelefuncAbortValue(error);
  if (abortValue?.message && typeof abortValue.message === "string") {
    return abortValue.message;
  }

  return getErrorMessage(error, fallbackMessage);
}

export function toErrorResponsePayload(error: unknown) {
  const appError = toAppError(error);
  return {
    message: appError.expose ? appError.message : "服务器开小差了，请稍后重试",
    code: appError.code,
    statusCode: appError.statusCode,
  };
}

export function toTelefuncErrorPayload(error: unknown) {
  return toErrorResponsePayload(error);
}

function getTelefuncAbortValue(error: unknown): TelefuncAbortValue | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const maybeAbort = error as Error & {
    isAbort?: unknown;
    abortValue?: unknown;
  };

  if (!maybeAbort.isAbort || !maybeAbort.abortValue || typeof maybeAbort.abortValue !== "object") {
    return null;
  }

  return maybeAbort.abortValue as TelefuncAbortValue;
}
