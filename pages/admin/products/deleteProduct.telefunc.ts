import { deleteProduct } from "../../../modules/catalog/service";

export async function onDeleteProduct(input: { id: number }) {
  return deleteProduct(input);
}
