import { enhance, type UniversalMiddleware } from "@universal-middleware/core";
import { internalServerError } from "../lib/app-error";
import { getPrismaForD1 } from "./prisma-factory";

interface PrismaEnv {
  DB?: D1Database;
}

/**
 * Returns the D1 binding exposed by the Cloudflare runtime when it exists.
 */
function getD1Database(
  runtime: Parameters<UniversalMiddleware>[2],
): D1Database | null {
  if (runtime.runtime !== "workerd") {
    return null;
  }

  return (runtime.env as PrismaEnv | undefined)?.DB ?? null;
}

/**
 * Attaches a Prisma Client to the shared request context.
 */
export const prismaMiddleware: UniversalMiddleware = enhance(
  async (_request, context, runtime) => {
    const database = getD1Database(runtime);
    if (!database) {
      throw internalServerError("数据库绑定缺失", "D1_BINDING_MISSING", {
        details: {
          binding: "DB",
          runtime: runtime.runtime,
        },
      });
    }

    const prisma = getPrismaForD1(database);

    const honoContext = (runtime as any)?.hono?.context;
    if (honoContext) {
      honoContext.set("universalContext", {
        ...context,
        prisma,
      });
    }

    return {
      ...context,
      prisma,
    };
  },
  {
    name: "my-app:prisma-middleware",
    immutable: false,
  },
);
