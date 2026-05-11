import { assertAdminAccess } from "../../../modules/auth/service";
import { saveCategory } from "../../../modules/catalog/service";

export async function onSaveCategory(input: {
  id?: number;
  name: string;
  slug?: string;
  description?: string;
  sort?: number;
}) {
  assertAdminAccess();
  return saveCategory(input);
}
