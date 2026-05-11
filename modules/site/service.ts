import { getContext } from "telefunc";
import type { PrismaClient } from "../../generated/prisma/client";
import { validateSiteSettingsInput } from "../../lib/validators/site";
import { getAdminContext, logAdminOperation } from "../auth/service";
import { getSiteSettingRecord, upsertSiteSettingRecord } from "./repository";
import type { SiteSettingInput } from "./types";

const defaultSiteSetting = {
  siteName: "",
  siteUrl: "",
  siteSubtitle: "",
  logoIcon: "",
  logo: "",
  notice: "",
  supportContact: null,
  footerText: null,
  orderNotice: null,
};

function normalizeSetting(record: Awaited<ReturnType<typeof getSiteSettingRecord>>) {
  if (!record) {
    return defaultSiteSetting;
  }

  return {
    siteName: record.siteName,
    siteUrl: record.siteUrl ?? "",
    siteSubtitle: record.siteSubtitle,
    logoIcon: record.logoIcon ?? "",
    logo: record.logo ?? "",
    notice: record.notice,
    supportContact: record.supportContact,
    footerText: record.footerText,
    orderNotice: record.orderNotice,
  };
}

export async function getPublicSiteInfo(prisma?: PrismaClient) {
  const client = prisma ?? getContext<{ prisma: PrismaClient }>().prisma;
  const record = await getSiteSettingRecord(client);
  return normalizeSetting(record);
}

export async function getSiteSetting(prisma?: PrismaClient) {
  return getPublicSiteInfo(prisma);
}

export async function saveSiteSetting(input: SiteSettingInput) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const { siteName, siteUrl } = validateSiteSettingsInput(input);

  const record = await upsertSiteSettingRecord(prisma, {
    siteName,
    siteUrl,
    siteSubtitle: input.siteSubtitle?.trim() || null,
    logoIcon: input.logoIcon?.trim() || null,
    logo: input.logo?.trim() || null,
    notice: input.notice?.trim() || null,
    supportContact: input.supportContact?.trim() || null,
    footerText: input.footerText?.trim() || null,
    orderNotice: input.orderNotice?.trim() || null,
  });

  await logAdminOperation(
    {
      action: "SAVE_SITE_SETTING",
      targetType: "SiteSetting",
      targetId: "1",
      detail: `siteName=${siteName}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return normalizeSetting(record);
}
