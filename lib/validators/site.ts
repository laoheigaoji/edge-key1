import { badRequestError } from "../app-error";

export function validateSiteSettingsInput(input: {
  siteName?: string;
  siteUrl?: string | null;
}) {
  const siteName = input.siteName?.trim() || "";
  if (!siteName) {
    throw badRequestError("站点名称不能为空", "SITE_NAME_REQUIRED");
  }

  const siteUrl = input.siteUrl?.trim() || "";
  if (!siteUrl) {
    throw badRequestError("网站地址不能为空", "SITE_URL_REQUIRED");
  }

  let normalizedSiteUrl = siteUrl;
  try {
    normalizedSiteUrl = new URL(siteUrl).toString().replace(/\/+$/, "");
  } catch {
    throw badRequestError("网站地址格式不正确，请填写完整的 http(s) 地址", "SITE_URL_INVALID");
  }

  return {
    siteName,
    siteUrl: normalizedSiteUrl,
  };
}
