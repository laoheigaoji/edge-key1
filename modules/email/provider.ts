import { badRequestError, externalServiceError } from "../../lib/app-error";
import type { EmailApiConfigValue, EmailProviderAdapter, EmailSendInput, EmailSmtpConfigValue } from "./types";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

async function parseJsonSafely(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildBrevoPayload(config: EmailApiConfigValue, input: EmailSendInput) {
  return {
    sender: {
      email: config.fromEmail,
      name: config.fromName || "API Mail",
    },
    to: [{ email: input.toEmail }],
    replyTo: input.replyTo || config.replyTo ? { email: input.replyTo || config.replyTo } : undefined,
    subject: input.subject,
    htmlContent: input.html || `<html><body><pre>${input.text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char] || char))}</pre></body></html>`,
    textContent: input.text,
  };
}

function buildMailjetPayload(config: EmailApiConfigValue, input: EmailSendInput) {
  return {
    Messages: [
      {
        From: {
          Email: config.fromEmail,
          Name: config.fromName || "API Mail",
        },
        To: [{ Email: input.toEmail }],
        ReplyTo: input.replyTo || config.replyTo ? { Email: input.replyTo || config.replyTo } : undefined,
        Subject: input.subject,
        TextPart: input.text,
        HTMLPart: input.html || `<html><body><pre>${input.text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char] || char))}</pre></body></html>`,
      },
    ],
  };
}

async function sendBrevoEmail(config: EmailApiConfigValue, input: EmailSendInput) {
  if (!config.apiBaseUrl || !config.apiKey) {
    throw badRequestError("Brevo 配置不完整", "BREVO_CONFIG_INCOMPLETE");
  }

  const response = await fetch(normalizeBaseUrl(config.apiBaseUrl), {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.apiKey,
    },
    body: JSON.stringify(buildBrevoPayload(config, input)),
  });

  const json = await parseJsonSafely(response);
  if (!response.ok) {
    throw externalServiceError(typeof json?.message === "string" ? json.message : "Brevo 发送邮件失败", "BREVO_SEND_FAILED");
  }

  return {
    messageId: typeof json?.messageId === "string" ? json.messageId : undefined,
    raw: json,
  };
}

async function sendMailjetEmail(config: EmailApiConfigValue, input: EmailSendInput) {
  if (!config.apiBaseUrl || !config.apiKey || !config.secretKey) {
    throw badRequestError("Mailjet 配置不完整", "MAILJET_CONFIG_INCOMPLETE");
  }

  const token = btoa(`${config.apiKey}:${config.secretKey}`);
  const response = await fetch(normalizeBaseUrl(config.apiBaseUrl), {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Basic ${token}`,
    },
    body: JSON.stringify(buildMailjetPayload(config, input)),
  });

  const json = await parseJsonSafely(response);
  if (!response.ok) {
    throw externalServiceError(typeof json?.ErrorMessage === "string" ? json.ErrorMessage : "Mailjet 发送邮件失败", "MAILJET_SEND_FAILED");
  }

  const messages = Array.isArray(json?.Messages) ? json.Messages : [];
  const firstMessage = messages[0] as { To?: Array<{ MessageID?: number }> } | undefined;
  const messageId = firstMessage?.To?.[0]?.MessageID;

  return {
    messageId: typeof messageId === "number" ? String(messageId) : undefined,
    raw: json,
  };
}

export function createSmtpEmailAdapter(config: EmailSmtpConfigValue): EmailProviderAdapter {
  return {
    async send(input) {
      if (!config.smtpHost || !config.smtpPort) {
        throw badRequestError("SMTP 配置不完整", "SMTP_CONFIG_INCOMPLETE");
      }

      const { WorkerMailer } = await import("worker-mailer");
      await WorkerMailer.send(
        {
          host: config.smtpHost,
          port: config.smtpPort,
          secure: config.smtpSecure ?? false,
          credentials: config.smtpUsername
            ? { username: config.smtpUsername, password: config.smtpPassword ?? "" }
            : undefined,
          authType: config.smtpAuthType ?? "plain",
        },
        {
          from: { email: config.fromEmail, name: config.fromName },
          to: input.toEmail,
          reply: input.replyTo || config.replyTo || undefined,
          subject: input.subject,
          text: input.text,
          html: input.html,
        },
      );

      return {};
    },
  };
}

export function createApiEmailAdapter(config: EmailApiConfigValue): EmailProviderAdapter {
  return {
    async send(input) {
      if (config.apiProvider === "BREVO") {
        return sendBrevoEmail(config, input);
      }

      return sendMailjetEmail(config, input);
    },
  };
}
