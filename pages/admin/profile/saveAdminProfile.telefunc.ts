import { assertAdminAccess, updateAdminProfile } from "../../../modules/auth/service";

export async function onSaveAdminProfile(input: {
  nickname?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  assertAdminAccess();
  return updateAdminProfile(input);
}
