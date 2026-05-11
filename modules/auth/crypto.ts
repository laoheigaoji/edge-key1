import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";

export async function hashAdminPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyAdminPassword(password: string, hash: string) {
  // 兼容旧 SHA-256 哈希（不以 $2b$ 开头）
  if (!hash.startsWith("$2b$") && !hash.startsWith("$2a$")) {
    const sha256 = createHash("sha256").update(password).digest("hex");
    return sha256 === hash;
  }
  return bcrypt.compare(password, hash);
}