import { assertAdminAccess } from "../../../modules/auth/service";
import { saveS3Config } from "../../../modules/media/service";
import type { S3ConfigInput } from "../../../modules/media/types";

export async function onSaveS3Config(input: S3ConfigInput) {
  assertAdminAccess();
  return saveS3Config(input);
}
