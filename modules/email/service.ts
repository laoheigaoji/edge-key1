import { getContext } from "telefunc";
import type { PrismaClient } from "../../generated/prisma/client";
import { badRequestError, getErrorMessage } from "../../lib/app-error";
import { logger } from "../../lib/logger";
import { validateEmailConfigInput, validateEmailTemplateInput, validateTestEmailInput } from "../../lib/validators/email";
import { getAdminContext, logAdminOperation } from "../auth/service";
import { getSiteSetting } from "../site/service";
import { createApiEmailAdapter, createSmtpEmailAdapter } from "./provider";
import {
  activateEmailConfigById,
  createEmailConfigRecord,
  createEmailLogRecord,
  deleteEmailConfigRecord,
  getActiveEmailConfigRecord,
  getEmailConfigRecordById,
  listEmailConfigRecords,
  listEmailLogRecords,
  listEmailTemplateRecords,
  updateEmailConfigRecord,
  updatePushFlagsForAllConfigs,
  upsertEmailTemplateRecord,
} from "./repository";
import type {
  EmailApiConfigValue,
  EmailChannel,
  EmailCloudflareConfigValue,
  EmailConfigValue,
  EmailLogItem,
  EmailOverviewMetric,
  EmailScene,
  EmailSmtpConfigValue,
  EmailTemplateValue,
} from "./types";

type EmailConfigRecord = Awaited<ReturnType<typeof listEmailConfigRecords>>[number];
type EmailTemplateRecord = Awaited<ReturnType<typeof listEmailTemplateRecords>>[number];
type EmailLogRecord = Awaited<ReturnType<typeof listEmailLogRecords>>[number];

const emailScenes = ["TEST", "ORDER_PAID", "DELIVERY_SUCCESS", "DELIVERY_FAILED"] as const;

function getChannelDisplayName(channel: EmailChannel) {
  return channel === "API" ? "API" : channel === "SMTP" ? "SMTP" : "CloudFlare";
}

const defaultPushSettings = {
  customerSendOrderPaidEmail: true,
  customerSendDeliverySuccessEmail: true,
  customerSendDeliveryFailedEmail: false,
  adminSendOrderPaidEmail: false,
  adminSendDeliverySuccessEmail: true,
  adminSendDeliveryFailedEmail: true,
};

const defaultApiConfig: EmailApiConfigValue = {
  provider: "API",
  isEnabled: false,
  apiProvider: "BREVO",
  fromEmail: "",
  fromName: "",
  replyTo: "",
  apiBaseUrl: "https://api.brevo.com/v3/smtp/email",
  apiKey: "",
  secretKey: "",
  timeoutMs: 10000,
  ...defaultPushSettings,
};

const defaultSmtpConfig: EmailSmtpConfigValue = {
  provider: "SMTP",
  isEnabled: false,
  fromEmail: "",
  fromName: "",
  replyTo: "",
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUsername: "",
  smtpPassword: "",
  ...defaultPushSettings,
};

const defaultCloudflareConfig: EmailCloudflareConfigValue = {
  provider: "CLOUDFLARE",
  isEnabled: false,
  fromEmail: "",
  fromName: "",
  replyTo: "",
  cloudflareBindingName: "",
  cloudflareDestinationAddress: "",
  cloudflareAllowedDestinationAddresses: [],
  ...defaultPushSettings,
};

const defaultTemplates: Record<EmailScene, EmailTemplateValue> = {
  TEST: {
    scene: "TEST",
    name: "测试邮件",
    subject: "[{{siteName}}] 测试邮件",
    content: "这是一封测试邮件。\n\n站点：{{siteName}}\n发送时间：{{sentAt}}\n\n{{customContent}}",
    isEnabled: true,
  },
  ORDER_PAID: {
    scene: "ORDER_PAID",
    name: "支付成功通知",
    subject: "[{{siteName}}] 订单 {{orderNo}} 支付成功",
    content: "您的订单已支付成功。\n\n订单号：{{orderNo}}\n商品：{{productName}}\n金额：{{amount}}\n查询地址：{{queryUrl}}\n\n{{footerText}}",
    isEnabled: true,
  },
  DELIVERY_SUCCESS: {
    scene: "DELIVERY_SUCCESS",
    name: "发货成功通知",
    subject: "[{{siteName}}] 订单 {{orderNo}} 已发货",
    content: "您的订单已完成发货。\n\n订单号：{{orderNo}}\n商品：{{productName}}\n数量：{{quantity}}\n发货内容：\n{{deliveryItems}}\n\n查询地址：{{queryUrl}}\n{{supportContact}}",
    isEnabled: true,
  },
  DELIVERY_FAILED: {
    scene: "DELIVERY_FAILED",
    name: "发货失败通知",
    subject: "[{{siteName}}] 订单 {{orderNo}} 发货失败",
    content: "订单发货失败，请尽快处理。\n\n订单号：{{orderNo}}\n商品：{{productName}}\n失败原因：{{errorMessage}}\n\n查询地址：{{queryUrl}}\n{{supportContact}}",
    isEnabled: true,
  },
};

function getEmailContext() {
  return getContext<{ prisma: PrismaClient }>();
}

function getDefaultConfig(provider: EmailChannel): EmailConfigValue {
  if (provider === "API") return { ...defaultApiConfig };
  if (provider === "SMTP") return { ...defaultSmtpConfig };
  return { ...defaultCloudflareConfig };
}

function normalizeEmailConfigFromRecord(record: EmailConfigRecord): EmailConfigValue {
  const provider = record.provider as EmailChannel;
  const defaults = getDefaultConfig(provider);

  try {
    const parsed = JSON.parse(record.configJson) as Partial<EmailConfigValue>;
    return {
      ...defaults,
      ...parsed,
      id: record.id,
      name: record.name,
      provider,
      isEnabled: record.isEnabled,
    } as EmailConfigValue;
  } catch {
    return {
      ...defaults,
      id: record.id,
      name: record.name,
      isEnabled: record.isEnabled,
    } as EmailConfigValue;
  }
}

function normalizeEmailTemplate(record: EmailTemplateRecord | undefined, scene: EmailScene): EmailTemplateValue {
  const defaults = defaultTemplates[scene];
  if (!record) {
    return defaults;
  }

  return {
    scene,
    name: record.name,
    subject: record.subject,
    content: record.content,
    isEnabled: record.isEnabled,
  };
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => values[key] ?? "");
}

function formatMetricValue(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function getQueryUrl(baseOrigin: string, orderNo: string, token: string) {
  return `${baseOrigin}/order/${encodeURIComponent(orderNo)}?token=${encodeURIComponent(token)}`;
}

function buildDeliveryItems(items: string[]) {
  if (!items.length) {
    return "暂无发货内容";
  }

  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function buildHtmlContent(text: string) {
  const escaped = text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char] || char));
  return `<html><body><pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, monospace;">${escaped}</pre></body></html>`;
}

async function createLog(prisma: PrismaClient, input: {
  orderId?: number;
  provider: EmailChannel;
  apiProvider?: "BREVO" | "MAILJET" | null;
  scene: EmailScene;
  status: "SUCCESS" | "FAILED";
  toEmail: string;
  subject: string;
  messageId?: string;
  error?: string;
  triggeredBy?: string;
}) {
  await createEmailLogRecord(prisma, {
    orderId: input.orderId,
    provider: input.provider,
    apiProvider: input.apiProvider ?? null,
    scene: input.scene,
    status: input.status,
    toEmail: input.toEmail,
    subject: input.subject,
    messageId: input.messageId ?? null,
    error: input.error ?? null,
    triggeredBy: input.triggeredBy ?? null,
  });
}

async function getActiveEmailConfig(prisma: PrismaClient): Promise<EmailConfigValue> {
  const record = await getActiveEmailConfigRecord(prisma);
  if (!record) {
    throw badRequestError("请先启用一个邮局配置", "EMAIL_CHANNEL_NOT_ENABLED");
  }

  return normalizeEmailConfigFromRecord(record);
}

async function getEmailBaseValues(prisma: PrismaClient) {
  const site = await getSiteSetting(prisma);
  const baseOrigin = site.siteUrl?.trim().replace(/\/+$/, "") || "";
  if (!baseOrigin) {
    throw badRequestError("站点设置缺少网站地址", "SITE_URL_MISSING");
  }

  return {
    siteName: site.siteName,
    footerText: site.footerText || "",
    supportContact: site.supportContact ? `客服联系方式：${site.supportContact}` : "",
    baseOrigin,
  };
}

async function sendByChannel(config: EmailConfigValue, input: {
  toEmail: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (config.provider === "API") {
    const adapter = createApiEmailAdapter(config);
    const result = await adapter.send({
      toEmail: input.toEmail,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: config.replyTo,
    });

    return {
      provider: config.provider,
      apiProvider: config.apiProvider,
      messageId: result.messageId,
    };
  }

  if (config.provider === "SMTP") {
    const adapter = createSmtpEmailAdapter(config);
    const result = await adapter.send({
      toEmail: input.toEmail,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: config.replyTo,
    });
    return {
      provider: config.provider,
      apiProvider: undefined,
      messageId: result.messageId,
    };
  }

  throw badRequestError("当前版本暂未接入 CloudFlare Email Send binding 的运行时发送，请先使用 API 分类", "CLOUDFLARE_NOT_IMPLEMENTED");
}

async function sendSceneEmail(prisma: PrismaClient, input: {
  scene: EmailScene;
  toEmail: string;
  values: Record<string, string>;
  orderId?: number;
  triggeredBy?: string;
  config?: EmailConfigValue;
}) {
  const config = input.config ?? await getActiveEmailConfig(prisma);
  const templates = await listEmailTemplateRecords(prisma);
  const template = normalizeEmailTemplate(templates.find((item: EmailTemplateRecord) => item.scene === input.scene), input.scene);

  if (!template) {
    return { skipped: true };
  }

  const subject = renderTemplate(template.subject, input.values);
  const text = renderTemplate(template.content, input.values);
  const html = buildHtmlContent(text);

  try {
    const result = await sendByChannel(config, {
      toEmail: input.toEmail,
      subject,
      text,
      html,
    });

    await createLog(prisma, {
      orderId: input.orderId,
      provider: result.provider,
      apiProvider: result.apiProvider ?? null,
      scene: input.scene,
      status: "SUCCESS",
      toEmail: input.toEmail,
      subject,
      messageId: result.messageId,
      triggeredBy: input.triggeredBy,
    });

    return {
      skipped: false,
      subject,
      messageId: result.messageId,
    };
  } catch (error) {
    const message = getErrorMessage(error, "邮件发送失败");
    await createLog(prisma, {
      orderId: input.orderId,
      provider: config.provider,
      apiProvider: config.provider === "API" ? config.apiProvider : null,
      scene: input.scene,
      status: "FAILED",
      toEmail: input.toEmail,
      subject,
      error: message,
      triggeredBy: input.triggeredBy,
    });
    logger.error(error instanceof Error ? error : String(error), {
      event: "email.send.failed",
      provider: config.provider,
      apiProvider: config.provider === "API" ? config.apiProvider : undefined,
      scene: input.scene,
      toEmail: input.toEmail,
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Public API: management data
// ---------------------------------------------------------------------------

export async function getEmailManagementData(prisma?: PrismaClient) {
  const client = prisma ?? getEmailContext().prisma;
  const [configRecords, templateRecords, logRecords] = await Promise.all([
    listEmailConfigRecords(client),
    listEmailTemplateRecords(client),
    listEmailLogRecords(client, 100),
  ]);

  const configs: EmailConfigValue[] = configRecords.map((record: EmailConfigRecord) =>
    normalizeEmailConfigFromRecord(record),
  );

  const templates = emailScenes.map((scene) =>
    normalizeEmailTemplate(
      templateRecords.find((item: EmailTemplateRecord) => item.scene === scene),
      scene,
    ),
  );

  const statsMap = {
    total: logRecords.length,
    success: logRecords.filter((item: EmailLogRecord) => item.status === "SUCCESS").length,
    failed: logRecords.filter((item: EmailLogRecord) => item.status === "FAILED").length,
    test: logRecords.filter((item: EmailLogRecord) => item.scene === "TEST").length,
  };

  const metrics: EmailOverviewMetric[] = [
    { label: "发送总数", value: formatMetricValue(statsMap.total) },
    { label: "成功次数", value: formatMetricValue(statsMap.success) },
    { label: "失败次数", value: formatMetricValue(statsMap.failed) },
    { label: "测试邮件", value: formatMetricValue(statsMap.test) },
  ];

  const logs: EmailLogItem[] = logRecords.map((item: EmailLogRecord) => ({
    id: item.id,
    provider: item.provider as EmailChannel,
    apiProvider: item.apiProvider as "BREVO" | "MAILJET" | null,
    scene: item.scene as EmailScene,
    status: item.status,
    toEmail: item.toEmail,
    subject: item.subject,
    messageId: item.messageId,
    error: item.error,
    triggeredBy: item.triggeredBy,
    createdAt: item.createdAt.toISOString(),
  }));

  // Derive current push settings from the first config (they're synced across all)
  const firstConfig = configs[0] ?? defaultApiConfig;
  const pushSettings = {
    customerSendOrderPaidEmail: firstConfig.customerSendOrderPaidEmail,
    customerSendDeliverySuccessEmail: firstConfig.customerSendDeliverySuccessEmail,
    customerSendDeliveryFailedEmail: firstConfig.customerSendDeliveryFailedEmail,
    adminSendOrderPaidEmail: firstConfig.adminSendOrderPaidEmail,
    adminSendDeliverySuccessEmail: firstConfig.adminSendDeliverySuccessEmail,
    adminSendDeliveryFailedEmail: firstConfig.adminSendDeliveryFailedEmail,
  };

  return {
    configs,
    templates,
    logs,
    metrics,
    pushSettings,
  };
}

// ---------------------------------------------------------------------------
// Public API: save push settings
// ---------------------------------------------------------------------------

export async function saveEmailPushSettings(input: {
  customerSendOrderPaidEmail: boolean;
  customerSendDeliverySuccessEmail: boolean;
  customerSendDeliveryFailedEmail: boolean;
  adminSendOrderPaidEmail: boolean;
  adminSendDeliverySuccessEmail: boolean;
  adminSendDeliveryFailedEmail: boolean;
}) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);

  await updatePushFlagsForAllConfigs(prisma, {
    customerSendOrderPaidEmail: Boolean(input.customerSendOrderPaidEmail),
    customerSendDeliverySuccessEmail: Boolean(input.customerSendDeliverySuccessEmail),
    customerSendDeliveryFailedEmail: Boolean(input.customerSendDeliveryFailedEmail),
    adminSendOrderPaidEmail: Boolean(input.adminSendOrderPaidEmail),
    adminSendDeliverySuccessEmail: Boolean(input.adminSendDeliverySuccessEmail),
    adminSendDeliveryFailedEmail: Boolean(input.adminSendDeliveryFailedEmail),
  });

  await logAdminOperation(
    {
      action: "SAVE_EMAIL_PUSH_SETTINGS",
      targetType: "EmailConfig",
      detail: `updated`,
    },
    {
      prisma,
      adminId,
    },
  );

  return true;
}

// ---------------------------------------------------------------------------
// Public API: activate a specific mailbox config by id
// ---------------------------------------------------------------------------

export async function activateEmailProvider(id: number) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);

  const record = await getEmailConfigRecordById(prisma, id);
  if (!record) {
    throw badRequestError("邮局配置不存在", "EMAIL_CONFIG_NOT_FOUND");
  }

  await activateEmailConfigById(prisma, id);

  await logAdminOperation(
    {
      action: "ACTIVATE_EMAIL_PROVIDER",
      targetType: "EmailConfig",
      targetId: String(id),
      detail: `activated ${record.name} (${record.provider})`,
    },
    {
      prisma,
      adminId,
    },
  );

  return true;
}

// ---------------------------------------------------------------------------
// Public API: save (create or update) an email config
// ---------------------------------------------------------------------------

function buildConfigJson(input: EmailConfigValue): Record<string, unknown> {
  if (input.provider === "API") {
    const apiInput = input as EmailApiConfigValue;
    return {
      apiProvider: apiInput.apiProvider,
      fromEmail: apiInput.fromEmail.trim(),
      fromName: apiInput.fromName?.trim() || "",
      replyTo: apiInput.replyTo?.trim() || "",
      apiBaseUrl: apiInput.apiBaseUrl.trim(),
      apiKey: apiInput.apiKey?.trim() || "",
      secretKey: apiInput.secretKey?.trim() || "",
      timeoutMs: Number(apiInput.timeoutMs || 10000),
      customerSendOrderPaidEmail: Boolean(apiInput.customerSendOrderPaidEmail),
      customerSendDeliverySuccessEmail: Boolean(apiInput.customerSendDeliverySuccessEmail),
      customerSendDeliveryFailedEmail: Boolean(apiInput.customerSendDeliveryFailedEmail),
      adminSendOrderPaidEmail: Boolean(apiInput.adminSendOrderPaidEmail),
      adminSendDeliverySuccessEmail: Boolean(apiInput.adminSendDeliverySuccessEmail),
      adminSendDeliveryFailedEmail: Boolean(apiInput.adminSendDeliveryFailedEmail),
    };
  }

  if (input.provider === "SMTP") {
    const smtpInput = input as EmailSmtpConfigValue;
    return {
      fromEmail: smtpInput.fromEmail.trim(),
      fromName: smtpInput.fromName?.trim() || "",
      replyTo: smtpInput.replyTo?.trim() || "",
      smtpHost: smtpInput.smtpHost?.trim() || "",
      smtpPort: Number(smtpInput.smtpPort || 0),
      smtpSecure: Boolean(smtpInput.smtpSecure),
      smtpUsername: smtpInput.smtpUsername?.trim() || "",
      smtpPassword: smtpInput.smtpPassword?.trim() || "",
      customerSendOrderPaidEmail: Boolean(smtpInput.customerSendOrderPaidEmail),
      customerSendDeliverySuccessEmail: Boolean(smtpInput.customerSendDeliverySuccessEmail),
      customerSendDeliveryFailedEmail: Boolean(smtpInput.customerSendDeliveryFailedEmail),
      adminSendOrderPaidEmail: Boolean(smtpInput.adminSendOrderPaidEmail),
      adminSendDeliverySuccessEmail: Boolean(smtpInput.adminSendDeliverySuccessEmail),
      adminSendDeliveryFailedEmail: Boolean(smtpInput.adminSendDeliveryFailedEmail),
    };
  }

  const cloudflareInput = input as EmailCloudflareConfigValue;
  return {
    fromEmail: cloudflareInput.fromEmail.trim(),
    fromName: cloudflareInput.fromName?.trim() || "",
    replyTo: cloudflareInput.replyTo?.trim() || "",
    cloudflareBindingName: cloudflareInput.cloudflareBindingName?.trim() || "",
    cloudflareDestinationAddress: cloudflareInput.cloudflareDestinationAddress?.trim() || "",
    cloudflareAllowedDestinationAddresses: cloudflareInput.cloudflareAllowedDestinationAddresses ?? [],
    customerSendOrderPaidEmail: Boolean(cloudflareInput.customerSendOrderPaidEmail),
    customerSendDeliverySuccessEmail: Boolean(cloudflareInput.customerSendDeliverySuccessEmail),
    customerSendDeliveryFailedEmail: Boolean(cloudflareInput.customerSendDeliveryFailedEmail),
    adminSendOrderPaidEmail: Boolean(cloudflareInput.adminSendOrderPaidEmail),
    adminSendDeliverySuccessEmail: Boolean(cloudflareInput.adminSendDeliverySuccessEmail),
    adminSendDeliveryFailedEmail: Boolean(cloudflareInput.adminSendDeliveryFailedEmail),
  };
}

function getDefaultName(input: EmailConfigValue): string {
  if (input.provider === "API") {
    const apiInput = input as EmailApiConfigValue;
    return `${apiInput.apiProvider} - ${apiInput.fromEmail || "未配置"}`;
  }
  if (input.provider === "SMTP") {
    const smtpInput = input as EmailSmtpConfigValue;
    return `SMTP - ${smtpInput.smtpHost || smtpInput.fromEmail || "未配置"}`;
  }
  const cfInput = input as EmailCloudflareConfigValue;
  return `CloudFlare - ${cfInput.fromEmail || "未配置"}`;
}

export async function saveEmailConfig(input: EmailConfigValue) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const validated = validateEmailConfigInput(input);

  const configJson = buildConfigJson({ ...input, provider: validated.provider } as EmailConfigValue);
  const name = input.name?.trim() || getDefaultName(input);

  // If input has an id, update existing record; otherwise create new
  if (input.id && input.id > 0) {
    const existingRecord = await getEmailConfigRecordById(prisma, input.id);
    if (!existingRecord) {
      throw badRequestError("邮局配置不存在", "EMAIL_CONFIG_NOT_FOUND");
    }

    const record = await updateEmailConfigRecord(prisma, input.id, {
      provider: validated.provider as EmailChannel,
      name,
      configJson: JSON.stringify(configJson),
    });

    await logAdminOperation(
      {
        action: "SAVE_EMAIL_CONFIG",
        targetType: "EmailConfig",
        targetId: String(input.id),
        detail: `updated: ${name}`,
      },
      {
        prisma,
        adminId,
      },
    );

    return normalizeEmailConfigFromRecord(record);
  }

  // Create new
  const record = await createEmailConfigRecord(prisma, {
    provider: validated.provider as EmailChannel,
    name,
    isEnabled: false,
    configJson: JSON.stringify(configJson),
  });

  await logAdminOperation(
    {
      action: "CREATE_EMAIL_CONFIG",
      targetType: "EmailConfig",
      targetId: String(record.id),
      detail: `created: ${name}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return normalizeEmailConfigFromRecord(record);
}

// ---------------------------------------------------------------------------
// Public API: delete an email config
// ---------------------------------------------------------------------------

export async function deleteEmailConfig(id: number) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);

  const record = await getEmailConfigRecordById(prisma, id);
  if (!record) {
    throw badRequestError("邮局配置不存在", "EMAIL_CONFIG_NOT_FOUND");
  }

  if (record.isEnabled) {
    throw badRequestError("不能删除当前激活的邮局配置，请先激活其他配置", "EMAIL_CONFIG_IS_ACTIVE");
  }

  await deleteEmailConfigRecord(prisma, id);

  await logAdminOperation(
    {
      action: "DELETE_EMAIL_CONFIG",
      targetType: "EmailConfig",
      targetId: String(id),
      detail: `deleted: ${record.name}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return true;
}

// ---------------------------------------------------------------------------
// Public API: save template
// ---------------------------------------------------------------------------

export async function saveEmailTemplate(input: EmailTemplateValue) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const validated = validateEmailTemplateInput(input);

  const existingRecord = await prisma.emailTemplate.findUnique({
    where: { scene: validated.scene as EmailScene },
  });

  const record = await upsertEmailTemplateRecord(prisma, validated.scene as EmailScene, {
    name: validated.name,
    subject: validated.subject,
    content: validated.content,
    isEnabled: existingRecord?.isEnabled ?? true,
  });

  await logAdminOperation(
    {
      action: "SAVE_EMAIL_TEMPLATE",
      targetType: "EmailTemplate",
      targetId: validated.scene,
      detail: validated.name,
    },
    {
      prisma,
      adminId,
    },
  );

  return normalizeEmailTemplate(record, validated.scene as EmailScene);
}

// ---------------------------------------------------------------------------
// Public API: send test email
// ---------------------------------------------------------------------------

export async function sendTestEmail(input: {
  toEmail: string;
  customContent?: string;
  configId?: number;
}) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const validated = validateTestEmailInput(input);
  const site = await getSiteSetting(prisma);

  // If a specific configId is provided, load that config directly instead of using the active one
  let targetConfig: EmailConfigValue | undefined;
  if (input.configId && input.configId > 0) {
    const record = await getEmailConfigRecordById(prisma, input.configId);
    if (!record) {
      throw badRequestError("指定的邮局配置不存在", "EMAIL_CONFIG_NOT_FOUND");
    }
    targetConfig = normalizeEmailConfigFromRecord(record);
  }

  const result = await sendSceneEmail(prisma, {
    scene: "TEST",
    toEmail: validated.toEmail,
    values: {
      siteName: site.siteName,
      sentAt: new Date().toLocaleString("zh-CN"),
      customContent: validated.customContent,
    },
    triggeredBy: `admin:${adminId || 0}`,
    config: targetConfig,
  });

  await logAdminOperation(
    {
      action: "SEND_TEST_EMAIL",
      targetType: "EmailLog",
      detail: `to=${validated.toEmail}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return result;
}

// ---------------------------------------------------------------------------
// Public API: clear email logs
// ---------------------------------------------------------------------------

export async function clearEmailLogs() {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);

  const { count } = await prisma.emailLog.deleteMany({});

  await logAdminOperation(
    { action: "CLEAR_EMAIL_LOGS", targetType: "EmailLog", detail: `deleted ${count} records` },
    { prisma, adminId },
  );

  return { count };
}

// ---------------------------------------------------------------------------
// Public API: notification hooks (called from order/delivery flows)
// ---------------------------------------------------------------------------

export async function notifyOrderPaid(input: {
  prisma?: PrismaClient;
  orderId: number;
  orderNo: string;
  queryToken: string;
  productName: string;
  amount: number;
  toEmail?: string | null;
}) {
  const prisma = input.prisma ?? getEmailContext().prisma;
  const config = await getActiveEmailConfig(prisma).catch((e) => {
    logger.error(e instanceof Error ? e : String(e), { event: "email.notify_order_paid.config_failed" });
    return null;
  });
  if (!config) return { skipped: true };

  const baseValues = await getEmailBaseValues(prisma);
  const values = {
    siteName: baseValues.siteName,
    orderNo: input.orderNo,
    productName: input.productName,
    amount: (input.amount / 100).toFixed(2),
    queryUrl: getQueryUrl(baseValues.baseOrigin, input.orderNo, input.queryToken),
    footerText: baseValues.footerText,
  };

  const tasks: Promise<any>[] = [];

  if (input.toEmail && config.customerSendOrderPaidEmail) {
    tasks.push(
      sendSceneEmail(prisma, {
        scene: "ORDER_PAID",
        toEmail: input.toEmail,
        orderId: input.orderId,
        triggeredBy: "payment_notify",
        values,
      }).catch(e => logger.error("Customer notifyOrderPaid failed:", e))
    );
  }

  if (config.adminSendOrderPaidEmail) {
    const admins = await prisma.admin.findMany({ where: { status: "ACTIVE" } });
    for (const admin of admins) {
      if (admin.email) {
        tasks.push(
          sendSceneEmail(prisma, {
            scene: "ORDER_PAID",
            toEmail: admin.email,
            orderId: input.orderId,
            triggeredBy: "payment_notify",
            values,
          }).catch(e => logger.error("Admin notifyOrderPaid failed:", e))
        );
      }
    }
  }

  await Promise.all(tasks);
  return { processed: true };
}

export async function notifyDeliverySuccess(input: {
  prisma?: PrismaClient;
  orderId: number;
  orderNo: string;
  queryToken: string;
  productName: string;
  quantity: number;
  items: string[];
  toEmail?: string | null;
}) {
  const prisma = input.prisma ?? getEmailContext().prisma;
  const config = await getActiveEmailConfig(prisma).catch((e) => {
    logger.error(e instanceof Error ? e : String(e), { event: "email.notify_delivery_success.config_failed" });
    return null;
  });
  if (!config) return { skipped: true };

  const baseValues = await getEmailBaseValues(prisma);
  const values = {
    siteName: baseValues.siteName,
    orderNo: input.orderNo,
    productName: input.productName,
    quantity: String(input.quantity),
    deliveryItems: buildDeliveryItems(input.items),
    queryUrl: getQueryUrl(baseValues.baseOrigin, input.orderNo, input.queryToken),
    supportContact: baseValues.supportContact,
  };

  const tasks: Promise<any>[] = [];

  if (input.toEmail && config.customerSendDeliverySuccessEmail) {
    tasks.push(
      sendSceneEmail(prisma, {
        scene: "DELIVERY_SUCCESS",
        toEmail: input.toEmail,
        orderId: input.orderId,
        triggeredBy: "delivery_success",
        values,
      }).catch(e => logger.error("Customer notifyDeliverySuccess failed:", e))
    );
  }

  if (config.adminSendDeliverySuccessEmail) {
    const admins = await prisma.admin.findMany({ where: { status: "ACTIVE" } });
    for (const admin of admins) {
      if (admin.email) {
        tasks.push(
          sendSceneEmail(prisma, {
            scene: "DELIVERY_SUCCESS",
            toEmail: admin.email,
            orderId: input.orderId,
            triggeredBy: "delivery_success",
            values,
          }).catch(e => logger.error("Admin notifyDeliverySuccess failed:", e))
        );
      }
    }
  }

  await Promise.all(tasks);
  return { processed: true };
}

export async function notifyDeliveryFailed(input: {
  prisma?: PrismaClient;
  orderId: number;
  orderNo: string;
  queryToken: string;
  productName: string;
  toEmail?: string | null;
  errorMessage: string;
}) {
  const prisma = input.prisma ?? getEmailContext().prisma;
  const config = await getActiveEmailConfig(prisma).catch((e) => {
    logger.error(e instanceof Error ? e : String(e), { event: "email.notify_delivery_failed.config_failed" });
    return null;
  });
  if (!config) return { skipped: true };

  const baseValues = await getEmailBaseValues(prisma);
  const values = {
    siteName: baseValues.siteName,
    orderNo: input.orderNo,
    productName: input.productName,
    errorMessage: input.errorMessage,
    queryUrl: getQueryUrl(baseValues.baseOrigin, input.orderNo, input.queryToken),
    supportContact: baseValues.supportContact,
  };

  const tasks: Promise<any>[] = [];

  if (input.toEmail && config.customerSendDeliveryFailedEmail) {
    tasks.push(
      sendSceneEmail(prisma, {
        scene: "DELIVERY_FAILED",
        toEmail: input.toEmail,
        orderId: input.orderId,
        triggeredBy: "delivery_failed",
        values,
      }).catch(e => logger.error("Customer notifyDeliveryFailed failed:", e))
    );
  }

  if (config.adminSendDeliveryFailedEmail) {
    const admins = await prisma.admin.findMany({ where: { status: "ACTIVE" } });
    for (const admin of admins) {
      if (admin.email) {
        tasks.push(
          sendSceneEmail(prisma, {
            scene: "DELIVERY_FAILED",
            toEmail: admin.email,
            orderId: input.orderId,
            triggeredBy: "delivery_failed",
            values,
          }).catch(e => logger.error("Admin notifyDeliveryFailed failed:", e))
        );
      }
    }
  }

  await Promise.all(tasks);
  return { processed: true };
}