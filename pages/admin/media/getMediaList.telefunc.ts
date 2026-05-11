import { assertAdminAccess } from "../../../modules/auth/service";
import { listMedia } from "../../../modules/media/service";
import type { MediaListFilters } from "../../../modules/media/types";

export async function onGetMediaList(filters: MediaListFilters) {
  assertAdminAccess();
  return listMedia(filters);
}
