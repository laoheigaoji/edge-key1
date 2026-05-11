import { deleteCategory } from "../../../modules/catalog/service";

export async function onDeleteCategory(input: { id: number }) {
  return deleteCategory(input);
}
