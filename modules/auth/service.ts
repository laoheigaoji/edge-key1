import { getContext } from "telefunc";
import type { PrismaClient } from "../../generated/prisma/client";
import { badRequestError, notFoundError, unauthorizedError } from "../../lib/app-error";
import { hashAdminPassword, verifyAdminPassword } from "./crypto";

export function assertAdminAccess() {
  const context = getContext<{ session?: { user?: { role?: string } } }>();

  if (context.session?.user?.role !== "admin") {
    throw unauthorizedError();
  }

  return true;
}

export function getAdminContext() {
  const context = getContext<{
    prisma: PrismaClient;
    session?: { user?: { id?: string; username?: string; role?: string } };
  }>();

  if (context.session?.user?.role !== "admin") {
    throw unauthorizedError();
  }

  return context;
}

export async function updateAdminProfile(input: {
  nickname?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const context = getAdminContext();
  const adminId = Number(context.session?.user?.id);
  if (!Number.isFinite(adminId)) {
    throw unauthorizedError();
  }

  const admin = await context.prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.status !== "ACTIVE") {
    throw notFoundError("管理员不存在或已禁用", "ADMIN_NOT_AVAILABLE");
  }

  const updateData: { nickname?: string | null; email?: string | null; passwordHash?: string } = {};

  if (typeof input.nickname === "string") {
    const nickname = input.nickname.trim();
    if (nickname.length > 50) {
      throw badRequestError("昵称长度不能超过 50 个字符", "NICKNAME_TOO_LONG");
    }
    updateData.nickname = nickname ? nickname : null;
  }

  if (typeof input.email === "string") {
    const email = input.email.trim();
    if (email && email.length > 100) {
      throw badRequestError("邮箱长度不能超过 100 个字符", "EMAIL_TOO_LONG");
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      throw badRequestError("邮箱格式不正确", "EMAIL_INVALID");
    }
    updateData.email = email ? email : null;
  }

  const wantsPasswordChange = Boolean(input.currentPassword || input.newPassword);
  if (wantsPasswordChange) {
    const currentPassword = input.currentPassword ?? "";
    const newPassword = input.newPassword ?? "";

    if (!currentPassword || !newPassword) {
      throw badRequestError("修改密码需要填写当前密码和新密码", "PASSWORD_INPUT_INCOMPLETE");
    }

    if (newPassword.length < 8) {
      throw badRequestError("新密码长度不能少于 8 位", "PASSWORD_TOO_SHORT");
    }

    const currentValid = await verifyAdminPassword(currentPassword, admin.passwordHash);
    if (!currentValid) {
      throw badRequestError("当前密码不正确", "CURRENT_PASSWORD_INVALID");
    }

    const newHash = await hashAdminPassword(newPassword);
    const newSameAsOld = await verifyAdminPassword(newPassword, admin.passwordHash);
    if (newSameAsOld) {
      throw badRequestError("新密码不能与当前密码相同", "PASSWORD_UNCHANGED");
    }

    updateData.passwordHash = newHash;
  }

  if (!Object.keys(updateData).length) {
    return {
      username: admin.username,
      nickname: admin.nickname ?? null,
      email: admin.email ?? null,
      passwordUpdated: false,
    };
  }

  const updated = await context.prisma.admin.update({
    where: { id: adminId },
    data: updateData,
  });

  const changed = Object.keys(updateData).sort().join(",");
  await logAdminOperation(
    {
      action: "UPDATE_ADMIN_PROFILE",
      targetType: "Admin",
      targetId: String(adminId),
      detail: changed,
    },
    {
      prisma: context.prisma,
      adminId,
    },
  );

  return {
    username: updated.username,
    nickname: updated.nickname ?? null,
    email: updated.email ?? null,
    passwordUpdated: Boolean(updateData.passwordHash),
  };
}

export async function logAdminOperation(input: {
  action: string;
  targetType: string;
  targetId?: string;
  detail?: string;
}, options?: { prisma: PrismaClient; adminId: number }) {
  const context = options ? null : getAdminContext();
  const prisma = options?.prisma ?? context!.prisma;
  const adminId = options?.adminId ?? Number(context?.session?.user?.id);

  if (!Number.isFinite(adminId) || adminId <= 0) {
    return;
  }

  await prisma.adminOperationLog.create({
    data: {
      adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      detail: input.detail,
    },
  });
}
