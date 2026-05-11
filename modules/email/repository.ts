import type { PrismaClient } from "../../generated/prisma/client";
import type { EmailApiProvider, EmailChannel, EmailScene } from "./types";

export function listEmailConfigRecords(prisma: PrismaClient) {
  return prisma.emailConfig.findMany({
    orderBy: [{ id: "asc" }],
  });
}

export function getEmailConfigRecordById(prisma: PrismaClient, id: number) {
  return prisma.emailConfig.findUnique({
    where: { id },
  });
}

export function getActiveEmailConfigRecord(prisma: PrismaClient) {
  return prisma.emailConfig.findFirst({
    where: { isEnabled: true },
  });
}

export function createEmailConfigRecord(
  prisma: PrismaClient,
  input: {
    provider: EmailChannel;
    name: string;
    isEnabled: boolean;
    configJson: string;
  },
) {
  return prisma.emailConfig.create({
    data: {
      provider: input.provider,
      name: input.name,
      isEnabled: input.isEnabled,
      configJson: input.configJson,
    },
  });
}

export function updateEmailConfigRecord(
  prisma: PrismaClient,
  id: number,
  input: {
    provider?: EmailChannel;
    name?: string;
    isEnabled?: boolean;
    configJson?: string;
  },
) {
  return prisma.emailConfig.update({
    where: { id },
    data: input,
  });
}

export function deleteEmailConfigRecord(prisma: PrismaClient, id: number) {
  return prisma.emailConfig.delete({
    where: { id },
  });
}



export async function activateEmailConfigById(prisma: PrismaClient, id: number) {
  await prisma.emailConfig.updateMany({
    where: { id: { not: id } },
    data: { isEnabled: false },
  });
  return prisma.emailConfig.update({
    where: { id },
    data: { isEnabled: true },
  });
}

export async function updatePushFlagsForAllConfigs(
  prisma: PrismaClient,
  flags: {
    customerSendOrderPaidEmail: boolean;
    customerSendDeliverySuccessEmail: boolean;
    customerSendDeliveryFailedEmail: boolean;
    adminSendOrderPaidEmail: boolean;
    adminSendDeliverySuccessEmail: boolean;
    adminSendDeliveryFailedEmail: boolean;
  },
) {
  const records = await prisma.emailConfig.findMany();
  for (const record of records) {
    let configJson: Record<string, unknown> = {};
    try {
      configJson = JSON.parse(record.configJson);
    } catch {
      configJson = {};
    }
    configJson.customerSendOrderPaidEmail = flags.customerSendOrderPaidEmail;
    configJson.customerSendDeliverySuccessEmail = flags.customerSendDeliverySuccessEmail;
    configJson.customerSendDeliveryFailedEmail = flags.customerSendDeliveryFailedEmail;
    configJson.adminSendOrderPaidEmail = flags.adminSendOrderPaidEmail;
    configJson.adminSendDeliverySuccessEmail = flags.adminSendDeliverySuccessEmail;
    configJson.adminSendDeliveryFailedEmail = flags.adminSendDeliveryFailedEmail;

    await prisma.emailConfig.update({
      where: { id: record.id },
      data: { configJson: JSON.stringify(configJson) },
    });
  }
}

export function listEmailTemplateRecords(prisma: PrismaClient) {
  return prisma.emailTemplate.findMany({
    orderBy: [{ scene: "asc" }],
  });
}

export function upsertEmailTemplateRecord(
  prisma: PrismaClient,
  scene: EmailScene,
  input: {
    name: string;
    subject: string;
    content: string;
    isEnabled: boolean;
  },
) {
  return prisma.emailTemplate.upsert({
    where: { scene },
    create: {
      scene,
      name: input.name,
      subject: input.subject,
      content: input.content,
      isEnabled: input.isEnabled,
    },
    update: {
      name: input.name,
      subject: input.subject,
      content: input.content,
      isEnabled: input.isEnabled,
    },
  });
}

export function listEmailLogRecords(prisma: PrismaClient, limit = 100) {
  return prisma.emailLog.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });
}

export function createEmailLogRecord(
  prisma: PrismaClient,
  input: {
    orderId?: number;
    provider: EmailChannel;
    apiProvider?: EmailApiProvider | null;
    scene: EmailScene;
    status: "SUCCESS" | "FAILED";
    toEmail: string;
    subject: string;
    messageId?: string | null;
    error?: string | null;
    triggeredBy?: string | null;
  },
) {
  return prisma.emailLog.create({
    data: {
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
    },
  });
}