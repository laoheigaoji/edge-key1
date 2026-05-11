import { assertAdminAccess } from "../../../modules/auth/service";
import { toggleCategoryStatus } from "../../../modules/catalog/service";

export async function onToggleCategory(input: { id: number; status: "ACTIVE" | "DISABLED" }) {
  assertAdminAccess();
  return toggleCategoryStatus(input);
}
