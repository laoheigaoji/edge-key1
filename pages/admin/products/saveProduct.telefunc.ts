import { assertAdminAccess } from "../../../modules/auth/service";
import { saveProduct } from "../../../modules/catalog/service";

export async function onSaveProduct(input: {
  id?: number;
  categoryId?: number | null;
  name: string;
  slug?: string;
  subtitle?: string;
  coverImage?: string;
  description?: string;
  price: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  minBuy: number;
  maxBuy: number;
  sort?: number;
  purchaseNote?: string;
}) {
  assertAdminAccess();
  return saveProduct(input);
}
