import { assertAdminAccess } from "../../../modules/auth/service";
import { activateEmailProvider, clearEmailLogs, deleteEmailConfig, saveEmailConfig, saveEmailPushSettings } from "../../../modules/email/service";

export async function onSaveEmailConfig(input: Record<string, unknown>) {
  assertAdminAccess();
  return saveEmailConfig(input as any);
}

export async function onDeleteEmailConfig(id: number) {
  assertAdminAccess();
  return deleteEmailConfig(id);
}

export async function onSaveEmailPushSettings(input: {
  customerSendOrderPaidEmail: boolean;
  customerSendDeliverySuccessEmail: boolean;
  customerSendDeliveryFailedEmail: boolean;
  adminSendOrderPaidEmail: boolean;
  adminSendDeliverySuccessEmail: boolean;
  adminSendDeliveryFailedEmail: boolean;
}) {
  assertAdminAccess();
  return saveEmailPushSettings(input);
}

export async function onActivateEmailProvider(id: number) {
  assertAdminAccess();
  return activateEmailProvider(id);
}

export async function onClearEmailLogs() {
  assertAdminAccess();
  return clearEmailLogs();
}