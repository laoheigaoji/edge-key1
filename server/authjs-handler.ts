import { Auth, type AuthConfig, createActionURL, setEnvDefaults } from "@auth/core";
import { CredentialsSignin } from "@auth/core/errors";
import CredentialsProvider from "@auth/core/providers/credentials";
import type { Session } from "@auth/core/types";
import { enhance, type UniversalHandler, type UniversalMiddleware } from "@universal-middleware/core";
import { PrismaClient } from "../generated/prisma/client";
import { internalServerError, rateLimitError } from "../lib/app-error";
import { logger } from "../lib/logger";
import { verifyAdminPassword, hashAdminPassword } from "../modules/auth/crypto";

const ADMIN_ROLE = "admin" as const;
const loginAttemptStore = new Map<string, { count: number; expiresAt: number }>();

interface AuthContext {
  prisma: PrismaClient;
  session?: Session | null;
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw internalServerError("认证配置缺失", "AUTH_SECRET_MISSING", {
      details: {
        envKeys: ["AUTH_SECRET", "NEXTAUTH_SECRET"],
      },
    });
  }

  return secret;
}

function getLoginRateLimitConfig() {
  // 登录尝试次数限制配置,默认 10 次/10 分钟
  const maxAttempts = Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS || 10);
  const windowMs = Number(process.env.ADMIN_LOGIN_WINDOW_MS || 10 * 60 * 1000);

  return {
    maxAttempts: Number.isFinite(maxAttempts) ? maxAttempts : 10,
    windowMs: Number.isFinite(windowMs) ? windowMs : 10 * 60 * 1000,
  };
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return request.headers.get("cf-connecting-ip") || forwarded?.split(",")[0]?.trim() || "unknown";
}

function isCredentialsCallbackRequest(request: Request) {
  const url = new URL(request.url);
  return request.method === "POST" && url.pathname.endsWith("/api/auth/callback/credentials");
}

function isRateLimited(request: Request) {
  const { maxAttempts, windowMs } = getLoginRateLimitConfig();
  const now = Date.now();
  const key = getClientIp(request);
  const current = loginAttemptStore.get(key);

  if (!current || current.expiresAt <= now) {
    loginAttemptStore.set(key, { count: 1, expiresAt: now + windowMs });
    return false;
  }

  current.count += 1;
  loginAttemptStore.set(key, current);
  return current.count > maxAttempts;
}

async function findAdminByCredentials(prisma: PrismaClient, username: string, password: string) {
  const admin = await prisma.admin.findUnique({
    where: { username },
  });

  if (!admin || admin.status !== "ACTIVE") {
    return null;
  }

  const valid = await verifyAdminPassword(password, admin.passwordHash);
  if (!valid) {
    return null;
  }

  // 旧 SHA-256 哈希自动升级为 bcrypt
  if (!admin.passwordHash.startsWith("$2b$") && !admin.passwordHash.startsWith("$2a$")) {
    try {
      const newHash = await hashAdminPassword(password);
      await prisma.admin.update({ where: { username }, data: { passwordHash: newHash } });
    } catch (e) {
      logger.error("auth.password_upgrade.failed", { error: e });
      const err = new CredentialsSignin("哈希字符串升级失败，请参考官网文档重置管理员密码");
      err.code = "password_upgrade_failed";
      throw err;
    }
  }

  return {
    id: String(admin.id),
    name: admin.nickname || admin.username,
    username: admin.username,
    role: ADMIN_ROLE,
  };
}

export function createAuthjsConfig(prisma: PrismaClient) {
  return {
    basePath: "/api/auth",
    trustHost: true,
    secret: getAuthSecret(),
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: "/admin/login",
    },
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          username: { label: "Username", type: "text", placeholder: "admin" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const usernameRaw = credentials?.username;
          const passwordRaw = credentials?.password;
          const username = typeof usernameRaw === "string" ? usernameRaw.trim() : "";
          const password = typeof passwordRaw === "string" ? passwordRaw : "";

          if (!username || !password) {
            return null;
          }

          return findAdminByCredentials(prisma, username, password);
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.username = user.username;
          token.role = user.role;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = typeof token.id === "string" ? token.id : undefined;
          session.user.username = typeof token.username === "string" ? token.username : undefined;
          session.user.role = token.role === ADMIN_ROLE ? ADMIN_ROLE : undefined;
        }
        return session;
      },
    },
  } satisfies Omit<AuthConfig, "raw">;
}

/**
 * Retrieve Auth.js session from Request
 */
export async function getSession(req: Request, config: Omit<AuthConfig, "raw">): Promise<Session | null> {
  setEnvDefaults(process.env, config);
  const requestURL = new URL(req.url);
  const url = createActionURL("session", requestURL.protocol, req.headers, process.env, config);

  const response = await Auth(new Request(url, { headers: { cookie: req.headers.get("cookie") ?? "" } }), config);

  const { status = 200 } = response;

  const data = await response.json();

  if (!data || !Object.keys(data).length) return null;
  if (status === 200) return data as Session;
  throw internalServerError(typeof data === "object" && "message" in data ? (data.message as string) : undefined, "AUTH_SESSION_REQUEST_FAILED", {
    details: {
      status,
    },
  });
}

// Note: You can directly define a server middleware instead of defining a Universal Middleware. (You can remove @universal-middleware/* — Vike's scaffolder uses it only to simplify its internal logic, see https://github.com/vikejs/vike/discussions/3116)
/**
 * Add Auth.js session to the context.
 * @link {@see https://authjs.dev/getting-started/session-management/get-session}
 */
export const authjsSessionMiddleware: UniversalMiddleware = enhance(
  // The context we add here is automatically merged into pageContext
  async (request, context) => {
    try {
      const authContext = context as unknown as AuthContext;
      const config = createAuthjsConfig(authContext.prisma);
      return {
        ...authContext,
        // Sets pageContext.session
        session: await getSession(request, config),
      };
    } catch (error) {
      logger.warn(error instanceof Error ? error : new Error(String(error)), {
        event: "auth.session.middleware_failed",
      });
      return {
        ...context,
        session: null,
      };
    }
  },
  {
    name: "my-app:authjs-middleware",
    immutable: false,
  },
);

// Note: You can directly define a server middleware instead of defining a Universal Middleware. (You can remove @universal-middleware/* — Vike's scaffolder uses it only to simplify its internal logic, see https://github.com/vikejs/vike/discussions/3116)
/**
 * Auth.js route
 * @link {@see https://authjs.dev/getting-started/installation}
 **/
export const authjsHandler = enhance(
  async (request, context) => {
    if (isCredentialsCallbackRequest(request) && isRateLimited(request)) {
      const error = rateLimitError("Too Many Requests", "AUTH_RATE_LIMITED");
      return new Response(error.message, {
        status: error.statusCode,
      });
    }

    const authContext = context as unknown as AuthContext;
    return Auth(request, createAuthjsConfig(authContext.prisma));
  },
  {
    name: "my-app:authjs-handler",
    path: "/api/auth/**",
    method: ["GET", "POST"],
    immutable: false,
  },
) satisfies UniversalHandler;
