import { assertAdminAccess } from "../../../modules/auth/service";
import { deleteCard } from "../../../modules/inventory/service";

export async function onDeleteCard(input: { id: number }) {
  assertAdminAccess();
  return deleteCard(input);
}