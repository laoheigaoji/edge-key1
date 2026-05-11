import { badRequestError } from "../app-error";

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePushFlags(input: {
  customerSendOrderPaidEmail?: boolean;
  customerSendDeliverySuccessEmail?: boolean;
  customerSendDeliveryFailedEmail?: boolean;
  adminSendOrderPaidEmail?: boolean;
  adminSendDeliverySuccessEmail?: boolean;
  adminSendDeliveryFailedEmail?: boolean;
}) {
  return {
    customerSendOrderPaidEmail: Boolean(input.customerSendOrderPaidEmail),
    customerSendDeliverySuccessEmail: Boolean(input.customerSendDeliverySuccessEmail),
    customerSendDeliveryFailedEmail: Boolean(input.customerSendDeliveryFailedEmail),
    adminSendOrderPaidEmail: Boolean(input.adminSendOrderPaidEmail),
    adminSendDeliverySuccessEmail: Boolean(input.adminSendDeliverySuccessEmail),
    adminSendDeliveryFailedEmail: Boolean(input.adminSendDeliveryFailedEmail),
  };
}

export function validateEmailConfigInput(input: any) {
  const provider = input.provider?.trim().toUpperCase() || "";
  if (!["API", "SMTP", "CLOUDFLARE"].includes(provider)) {
    throw badRequestError("邮件配置分类不正确", "EMAIL_CHANNEL_INVALID");
  }

  const fromEmail = input.fromEmail?.trim() || "";
  if (!fromEmail) {
    throw badRequestError("发件邮箱不能为空", "EMAIL_FROM_REQUIRED");
  }

  if (!isEmail(fromEmail)) {
    throw badRequestError("发件邮箱格式不正确", "EMAIL_FROM_INVALID");
  }

  const flags = validatePushFlags(input);

  if (provider === "API") {
    const apiProvider = input.apiProvider?.trim().toUpperCase() || "";
    if (!["BREVO", "MAILJET"].includes(apiProvider)) {
      throw badRequestError("API 服务商不正确", "EMAIL_API_PROVIDER_INVALID");
    }

    const apiBaseUrl = input.apiBaseUrl?.trim() || "";
    if (!apiBaseUrl) {
      throw badRequestError("必须填写 API 地址", "EMAIL_API_BASE_URL_REQUIRED");
    }

    if (!(input.apiKey?.trim())) {
      throw badRequestError("必须填写 API Key", "EMAIL_API_KEY_REQUIRED");
    }

    if (apiProvider === "MAILJET" && !(input.secretKey?.trim())) {
      throw badRequestError("Mailjet 必须填写 Secret Key", "MAILJET_SECRET_REQUIRED");
    }

    return {
      provider: "API" as const,
      fromEmail,
      apiProvider: apiProvider as "BREVO" | "MAILJET",
      apiBaseUrl,
      ...flags,
    };
  }

  if (provider === "SMTP") {
    const smtpHost = input.smtpHost?.trim() || "";
    if (!smtpHost) {
      throw badRequestError("必须填写 SMTP Host", "SMTP_HOST_REQUIRED");
    }

    const smtpPort = Number(input.smtpPort || 0);
    if (!Number.isInteger(smtpPort) || smtpPort <= 0 || smtpPort > 65535) {
      throw badRequestError("必须填写正确的端口", "SMTP_PORT_INVALID");
    }

    if (!(input.smtpUsername?.trim())) {
      throw badRequestError("必须填写用户名", "SMTP_USERNAME_REQUIRED");
    }

    if (!(input.smtpPassword?.trim())) {
      throw badRequestError("必须填写密码", "SMTP_PASSWORD_REQUIRED");
    }

    return {
      provider: "SMTP" as const,
      fromEmail,
      smtpHost,
      smtpPort,
      ...flags,
    };
  }

  const bindingName = input.cloudflareBindingName?.trim() || "";
  if (!bindingName) {
    throw badRequestError("必须填写 Binding 名称", "CLOUDFLARE_BINDING_REQUIRED");
  }

  return {
    provider: "CLOUDFLARE" as const,
    fromEmail,
    cloudflareBindingName: bindingName,
    ...flags,
  };
}

export function validateEmailTemplateInput(input: {
  scene?: string;
  name?: string;
  subject?: string;
  content?: string;
}) {
  const scene = input.scene?.trim().toUpperCase() || "";
  if (!scene) {
    throw badRequestError("模板场景不能为空", "EMAIL_TEMPLATE_SCENE_REQUIRED");
  }

  const name = input.name?.trim() || "";
  if (!name) {
    throw badRequestError("模板名称不能为空", "EMAIL_TEMPLATE_NAME_REQUIRED");
  }

  const subject = input.subject?.trim() || "";
  if (!subject) {
    throw badRequestError("邮件主题不能为空", "EMAIL_TEMPLATE_SUBJECT_REQUIRED");
  }

  const content = input.content?.trim() || "";
  if (!content) {
    throw badRequestError("邮件内容不能为空", "EMAIL_TEMPLATE_CONTENT_REQUIRED");
  }

  return {
    scene,
    name,
    subject,
    content,
  };
}

export function validateTestEmailInput(input: {
  toEmail?: string;
  customContent?: string;
}) {
  const toEmail = input.toEmail?.trim() || "";
  if (!toEmail) {
    throw badRequestError("测试收件邮箱不能为空", "TEST_EMAIL_TO_REQUIRED");
  }

  if (!isEmail(toEmail)) {
    throw badRequestError("测试收件邮箱格式不正确", "TEST_EMAIL_TO_INVALID");
  }

  return {
    toEmail,
    customContent: input.customContent?.trim() || "",
  };
}
