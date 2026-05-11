import type { S3ConfigInput } from "../../../modules/media/types";
import { assertAdminAccess } from "../../../modules/auth/service";
import { testS3Connection } from "../../../modules/media/service";

export async function onTestS3Connection(input?: S3ConfigInput) {
  assertAdminAccess();
  return testS3Connection(input);
}
