import { assertAdminAccess } from "../../../modules/auth/service";
import { sendTestEmail } from "../../../modules/email/service";

export async function onSendTestEmail(input: {
  toEmail: string;
  customContent?: string;
  configId?: number;
}) {
  assertAdminAccess();
  return sendTestEmail(input);
}
