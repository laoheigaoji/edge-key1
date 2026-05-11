export type EmailChannel = "API" | "SMTP" | "CLOUDFLARE";

export type EmailApiProvider = "BREVO" | "MAILJET";

export type EmailScene = "TEST" | "ORDER_PAID" | "DELIVERY_SUCCESS" | "DELIVERY_FAILED";

export interface EmailPushFlags {
  customerSendOrderPaidEmail: boolean;
  customerSendDeliverySuccessEmail: boolean;
  customerSendDeliveryFailedEmail: boolean;
  adminSendOrderPaidEmail: boolean;
  adminSendDeliverySuccessEmail: boolean;
  adminSendDeliveryFailedEmail: boolean;
}

export interface EmailApiConfigValue extends EmailPushFlags {
  id?: number;
  name?: string;
  provider: "API";
  isEnabled: boolean;
  apiProvider: EmailApiProvider;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  apiBaseUrl: string;
  apiKey?: string;
  secretKey?: string;
  timeoutMs?: number;
}

export interface EmailSmtpConfigValue extends EmailPushFlags {
  id?: number;
  name?: string;
  provider: "SMTP";
  isEnabled: boolean;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpAuthType?: "plain" | "login" | "cram-md5";
}

export interface EmailCloudflareConfigValue extends EmailPushFlags {
  id?: number;
  name?: string;
  provider: "CLOUDFLARE";
  isEnabled: boolean;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  cloudflareBindingName?: string;
  cloudflareDestinationAddress?: string;
  cloudflareAllowedDestinationAddresses?: string[];
}

export type EmailConfigValue = EmailApiConfigValue | EmailSmtpConfigValue | EmailCloudflareConfigValue;

export interface EmailTemplateValue {
  scene: EmailScene;
  name: string;
  subject: string;
  content: string;
  isEnabled: boolean;
}

export interface EmailLogItem {
  id: number;
  provider: EmailChannel;
  apiProvider?: EmailApiProvider | null;
  scene: EmailScene;
  status: "SUCCESS" | "FAILED";
  toEmail: string;
  subject: string;
  messageId?: string | null;
  error?: string | null;
  triggeredBy?: string | null;
  createdAt: string;
}

export interface EmailOverviewMetric {
  label: string;
  value: string;
}

export interface EmailSendInput {
  toEmail: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  messageId?: string;
  raw?: unknown;
}

export interface EmailProviderAdapter {
  send(input: EmailSendInput): Promise<EmailSendResult>;
}
