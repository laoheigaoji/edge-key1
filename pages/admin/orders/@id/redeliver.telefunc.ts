import { assertAdminAccess } from "../../../../modules/auth/service";
import { redeliverOrder } from "../../../../modules/delivery/service";
import { getContext } from "telefunc";
import type { PrismaClient } from "../../../../generated/prisma/client";

export async function onRedeliver(input: { orderId: number }) {
  assertAdminAccess();
  const { prisma } = getContext<{ prisma: PrismaClient }>();
  return redeliverOrder(prisma, input.orderId);
}
