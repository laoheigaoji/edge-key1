import { assertAdminAccess } from "../../../modules/auth/service";
import { createCard } from "../../../modules/inventory/service";

export async function onCreateCard(input: { productId: number; content: string; batchNo?: string; force?: boolean }) {
  assertAdminAccess();
  return createCard(input);
}
