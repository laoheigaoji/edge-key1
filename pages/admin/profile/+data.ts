import type { PrismaClient } from "../../../generated/prisma/client";

export type Data = ReturnType<typeof data>;

export async function data(pageContext: {
  prisma: PrismaClient;
  session?: { user?: { id?: string; role?: string } };
}) {
  if (pageContext.session?.user?.role !== "admin") {
    return {
      profile: null,
    };
  }

  const adminId = Number(pageContext.session?.user?.id);
  if (!Number.isFinite(adminId)) {
    return {
      profile: null,
    };
  }

  const admin = await pageContext.prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      username: true,
      nickname: true,
      email: true,
      status: true,
    },
  });

  if (!admin || admin.status !== "ACTIVE") {
    return {
      profile: null,
    };
  }

  return {
    profile: {
      username: admin.username,
      nickname: admin.nickname ?? "",
      email: admin.email ?? "",
    },
  };
}

