import type { PrismaClient } from "../../../generated/prisma/client";
import { getEmailManagementData } from "../../../modules/email/service";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: {
  prisma: PrismaClient;
  session?: { user?: { role?: string } };
}) {
  if (pageContext.session?.user?.role !== "admin") {
    return {
      configs: [],
      templates: [],
      logs: [],
      metrics: [],
      pushSettings: {
        customerSendOrderPaidEmail: false,
        customerSendDeliverySuccessEmail: false,
        customerSendDeliveryFailedEmail: false,
        adminSendOrderPaidEmail: false,
        adminSendDeliverySuccessEmail: false,
        adminSendDeliveryFailedEmail: false,
      },
    };
  }

  return getEmailManagementData(pageContext.prisma);
}
