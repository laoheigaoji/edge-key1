import { assertAdminAccess } from "../../../modules/auth/service";
import { deleteUnusedCards } from "../../../modules/inventory/service";

export async function onDeleteUnusedCards(input: { productId: number }) {
  assertAdminAccess();
  return deleteUnusedCards(input);
}
