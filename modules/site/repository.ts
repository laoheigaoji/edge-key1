import type { PrismaClient } from "../../generated/prisma/client";

export function getSiteSettingRecord(prisma: PrismaClient) {
  return prisma.siteSetting.findUnique({
    where: { id: 1 },
  });
}

export function upsertSiteSettingRecord(
  prisma: PrismaClient,
  input: {
    siteName: string;
    siteUrl?: string | null;
    siteSubtitle?: string | null;
    logoIcon?: string | null;
    logo?: string | null;
    notice?: string | null;
    supportContact?: string | null;
    footerText?: string | null;
    orderNotice?: string | null;
  },
) {
  return prisma.siteSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      siteName: input.siteName,
      siteUrl: input.siteUrl ?? null,
      siteSubtitle: input.siteSubtitle ?? null,
      logoIcon: input.logoIcon ?? null,
      logo: input.logo ?? null,
      notice: input.notice ?? null,
      supportContact: input.supportContact ?? null,
      footerText: input.footerText ?? null,
      orderNotice: input.orderNotice ?? null,
    },
    update: {
      siteName: input.siteName,
      siteUrl: input.siteUrl ?? null,
      siteSubtitle: input.siteSubtitle ?? null,
      logoIcon: input.logoIcon ?? null,
      logo: input.logo ?? null,
      notice: input.notice ?? null,
      supportContact: input.supportContact ?? null,
      footerText: input.footerText ?? null,
      orderNotice: input.orderNotice ?? null,
    },
  });
}
