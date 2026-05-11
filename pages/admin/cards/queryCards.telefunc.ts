import { assertAdminAccess } from "../../../modules/auth/service";
import { getAdminCardsPaged } from "../../../modules/inventory/service";

export async function onQueryCards(params: {
  productId?: number;
  batchNo?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}) {
  assertAdminAccess();
  return getAdminCardsPaged(params);
}