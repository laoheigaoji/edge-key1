import type { PrismaClient, Prisma, CardStatus } from "../../generated/prisma/client";

export function listCardRecords(prisma: PrismaClient) {
  return prisma.card.findMany({
    include: {
      product: true,
    },
    orderBy: [{ id: "desc" }],
  });
}

export function createCardRecord(
  prisma: PrismaClient,
  input: {
    productId: number;
    content: string;
    batchNo?: string | null;
  },
) {
  return prisma.card.create({
    data: {
      productId: input.productId,
      content: input.content,
      batchNo: input.batchNo ?? null,
    },
    include: {
      product: true,
    },
  });
}

export function createManyCards(
  prisma: PrismaClient,
  input: Array<{
    productId: number;
    content: string;
    batchNo?: string | null;
  }>,
) {
  return prisma.card.createMany({
    data: input.map((item) => ({
      productId: item.productId,
      content: item.content,
      batchNo: item.batchNo ?? null,
    })),
  });
}

export function deleteUnusedCardsByProduct(prisma: PrismaClient, productId: number) {
  return prisma.card.deleteMany({
    where: {
      productId,
      status: "UNUSED",
    },
  });
}

export function countCardStats(prisma: PrismaClient) {
  return prisma.card.groupBy({
    by: ["status"],
    _count: {
      _all: true,
    },
  });
}

export function listCardRecordsPaged(
  prisma: PrismaClient,
  params: {
    productId?: number;
    batchNo?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    pageSize: number;
  },
) {
  const where: Prisma.CardWhereInput = {};
  if (params.productId) where.productId = params.productId;
  if (params.batchNo) where.batchNo = { contains: params.batchNo };
  if (params.status) where.status = params.status as CardStatus;
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = new Date(params.startDate);
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  const skip = (params.page - 1) * params.pageSize;
  return Promise.all([
    prisma.card.findMany({ where, include: { product: true }, orderBy: [{ id: "desc" }], skip, take: params.pageSize }),
    prisma.card.count({ where }),
  ]);
}

export function deleteCardById(prisma: PrismaClient, id: number) {
  return prisma.card.deleteMany({
    where: { id, status: "UNUSED" },
  });
}

export async function findExistingCardContents(
  prisma: PrismaClient,
  productId: number,
  contents: string[],
): Promise<string[]> {
  const existingCards = await prisma.card.findMany({
    where: {
      productId,
      content: {
        in: contents,
      },
    },
    select: {
      content: true,
    },
  });
  return existingCards.map((card) => card.content);
}
