import { getContext } from "telefunc";
import type { PrismaClient } from "../../generated/prisma/client";
import { badRequestError } from "../../lib/app-error";
import { getAdminContext, logAdminOperation } from "../auth/service";
import { parseCardLines } from "./importer";
import { countCardStats, createCardRecord, createManyCards, deleteCardById, deleteUnusedCardsByProduct, listCardRecords, listCardRecordsPaged, findExistingCardContents } from "./repository";

function getInventoryContext() {
  return getContext<{ prisma: PrismaClient }>();
}

function previewCard(content: string) {
  if (content.length <= 8) {
    return content;
  }

  return `${content.slice(0, 4)}****${content.slice(-4)}`;
}

export async function getInventoryOverview(prisma?: PrismaClient) {
  const client = prisma ?? getInventoryContext().prisma;
  const stats = await countCardStats(client);

  const summary = {
    total: 0,
    available: 0,
    sold: 0,
  };

  for (const item of stats) {
    summary.total += item._count._all;
    if (item.status === "UNUSED") summary.available += item._count._all;
    if (item.status === "SOLD") summary.sold += item._count._all;
  }

  return summary;
}

export async function getAdminCards(prisma?: PrismaClient) {
  const client = prisma ?? getInventoryContext().prisma;
  const cards = await listCardRecords(client);

  return cards.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    status: item.status,
    batchNo: item.batchNo,
    orderId: item.orderId,
    soldAt: item.soldAt ? item.soldAt.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
    contentPreview: previewCard(item.content),
  }));
}

export async function createCard(input: { productId: number; content: string; batchNo?: string; force?: boolean }) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const content = input.content.trim();

  if (!content) {
    throw badRequestError("卡密内容不能为空", "CARD_CONTENT_REQUIRED");
  }

  // 验证商品是否存在
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) {
    throw badRequestError('请选择要导入卡密的商品', "PRODUCT_NOT_FOUND");
  }

  // 检查数据库中是否存在重复卡密
  const existingContents = await findExistingCardContents(prisma, input.productId, [content]);
  if (existingContents.length > 0 && !input.force) {
    return {
      requiresConfirmation: true,
      message: existingContents.length === 1
        ? `该卡密「${existingContents[0]}」已存在于系统中，是否继续添加？`
        : `该卡密「${existingContents[0]}」已存在于系统中共有 ${existingContents.length} 条记录，是否继续添加？`,
      existingContent: existingContents,
    };
  }

  const card = await createCardRecord(prisma, {
    productId: input.productId,
    content,
    batchNo: input.batchNo?.trim() || null,
  });

  await logAdminOperation(
    {
      action: "CREATE_CARD",
      targetType: "Card",
      targetId: String(card.id),
      detail: `productId=${card.productId}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return {
    id: card.id,
    productId: card.productId,
    productName: card.product.name,
    status: card.status,
    batchNo: card.batchNo,
    orderId: card.orderId,
    soldAt: null,
    createdAt: card.createdAt.toISOString(),
    contentPreview: previewCard(card.content),
  };
}

export async function importCards(input: { productId: number; lines: string; batchNo?: string; skipInputDedup?: boolean; force?: boolean }) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const { items, removedCount } = parseCardLines(input.lines);

  if (!items.length) {
    throw badRequestError("没有可导入的卡密内容", "CARD_IMPORT_EMPTY");
  }

  // 检测输入编辑框是否有重复项目（skipInputDedup=true 时跳过）
  if (removedCount > 0 && !input.skipInputDedup) {
    return {
      requiresConfirmation: true,
      type: "input_duplicates" as const,
      message: "您当前输入的卡密重复，是否删除重复卡密？",
      removedCount,
      items,
    };
  }

  // 验证商品是否存在
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) {
    throw badRequestError('请选择要导入卡密的商品', "PRODUCT_NOT_FOUND");
  }

  // 检测数据库是否有重复卡密（force=true 时跳过）
  const existingContents = await findExistingCardContents(prisma, input.productId, items);
  if (existingContents.length > 0 && !input.force) {
    return {
      requiresConfirmation: true,
      type: "db_duplicates" as const,
      message: existingContents.length === 1
        ? `该卡密「${existingContents[0]}」已存在于系统中，是否继续添加？`
        : `该卡密「${existingContents[0]}」已存在于系统中共有 ${existingContents.length} 条记录，是否继续添加？`,
      existingContents,
      items,
    };
  }

  await createManyCards(
    prisma,
    items.map((content) => ({
      productId: input.productId,
      content,
      batchNo: input.batchNo?.trim() || null,
    })),
  );

  await logAdminOperation(
    {
      action: "IMPORT_CARDS",
      targetType: "Card",
      targetId: String(input.productId),
      detail: `count=${items.length}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return {
    count: items.length,
  };
}

export async function deleteUnusedCards(input: { productId: number }) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const result = await deleteUnusedCardsByProduct(prisma, input.productId);

  await logAdminOperation(
    {
      action: "DELETE_UNUSED_CARDS",
      targetType: "Card",
      targetId: String(input.productId),
      detail: `count=${result.count}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return {
    count: result.count,
  };
}

export async function deleteCard(input: { id: number }) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const result = await deleteCardById(prisma, input.id);
  if (result.count === 0) throw badRequestError("卡密不存在或已售出，无法删除", "CARD_DELETE_FAILED");
  await logAdminOperation({ action: "DELETE_CARD", targetType: "Card", targetId: String(input.id), detail: "" }, { prisma, adminId });
  return { id: input.id };
}

export async function getAdminCardsPaged(params: {
  productId?: number;
  batchNo?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}) {
  const { prisma } = getAdminContext();
  const [cards, total] = await listCardRecordsPaged(prisma, params);
  return {
    total,
    items: cards.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      status: item.status,
      batchNo: item.batchNo,
      orderId: item.orderId,
      soldAt: item.soldAt ? item.soldAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
      contentPreview: previewCard(item.content),
    })),
  };
}
