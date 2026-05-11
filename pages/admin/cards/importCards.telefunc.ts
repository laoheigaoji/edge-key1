import { assertAdminAccess } from "../../../modules/auth/service";
import { importCards } from "../../../modules/inventory/service";

export async function onImportCards(input: { productId: number; lines: string; batchNo?: string; skipInputDedup?: boolean; force?: boolean }) {
  assertAdminAccess();
  return importCards(input);
}
