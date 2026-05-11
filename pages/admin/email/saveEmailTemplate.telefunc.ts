import { assertAdminAccess } from "../../../modules/auth/service";
import { saveEmailTemplate } from "../../../modules/email/service";

export async function onSaveEmailTemplate(input: {
  scene: "TEST" | "ORDER_PAID" | "DELIVERY_SUCCESS" | "DELIVERY_FAILED";
  name: string;
  subject: string;
  content: string;
  isEnabled: boolean;
}) {
  assertAdminAccess();
  return saveEmailTemplate(input);
}
