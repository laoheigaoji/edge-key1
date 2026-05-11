import { assertAdminAccess } from "../../../modules/auth/service";
import { getS3Config } from "../../../modules/media/service";

export async function onGetS3Config() {
  assertAdminAccess();
  return getS3Config();
}
