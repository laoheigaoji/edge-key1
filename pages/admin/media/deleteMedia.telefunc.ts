import { assertAdminAccess } from "../../../modules/auth/service";
import { deleteMedia } from "../../../modules/media/service";

export async function onDeleteMedia(mediaId: number) {
  assertAdminAccess();
  return deleteMedia(mediaId);
}
