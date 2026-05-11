import type { PrismaClient } from "../../generated/prisma/client";
import { conflictError } from "../../lib/app-error";

export async function allocateCardsForOrder(prisma: PrismaClient, orderId: number, productId: number, quantity: number) {
  const cards = await prisma.card.findMany({
    where: {
      productId,
      status: "UNUSED",
    },
    orderBy: [{ id: "asc" }],
    take: quantity,
  });

  if (cards.length < quantity) {
    throw conflictError("库存不足，无法完成自动发货", "CARD_INVENTORY_SHORTAGE");
  }

  for (const card of cards) {
    await prisma.card.update({
      where: { id: card.id },
      data: {
        status: "SOLD",
        orderId,
        soldAt: new Date(),
      },
    });
  }

  return cards;
}
