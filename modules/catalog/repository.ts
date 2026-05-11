import type { PrismaClient } from "../../generated/prisma/client";

export function listProductRecords() {
  return [];
}

export function listAdminProductRecords(prisma: PrismaClient) {
  return prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: [{ sort: "asc" }, { id: "desc" }],
  });
}

export function listHomeCategoryRecords(prisma: PrismaClient) {
  return prisma.category.findMany({
    where: {
      status: "ACTIVE",
      products: {
        some: {
          status: "ACTIVE",
        },
      },
    },
    orderBy: [{ sort: "asc" }, { id: "desc" }],
  });
}

export function findProductRecordById(prisma: PrismaClient, id: number) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });
}

export function listCategoryRecords(prisma: PrismaClient) {
  return prisma.category.findMany({
    orderBy: [{ sort: "asc" }, { id: "desc" }],
  });
}

export function upsertCategoryRecord(
  prisma: PrismaClient,
  input: {
    id?: number;
    name: string;
    slug: string;
    description?: string | null;
    sort: number;
  },
) {
  if (input.id) {
    return prisma.category.update({
      where: { id: input.id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        sort: input.sort,
      },
    });
  }

  return prisma.category.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      sort: input.sort,
    },
  });
}

export function updateCategoryStatus(prisma: PrismaClient, id: number, status: "ACTIVE" | "DISABLED") {
  return prisma.category.update({
    where: { id },
    data: { status },
  });
}

export function deleteCategoryRecord(prisma: PrismaClient, id: number) {
  return prisma.category.delete({
    where: { id },
  });
}

export function upsertProductRecord(
  prisma: PrismaClient,
  input: {
    id?: number;
    categoryId?: number | null;
    name: string;
    slug: string;
    subtitle?: string | null;
    coverImage?: string | null;
    description?: string | null;
    price: number;
    status: "DRAFT" | "ACTIVE" | "INACTIVE";
    minBuy: number;
    maxBuy: number;
    sort: number;
    purchaseNote?: string | null;
  },
) {
  const data = {
    categoryId: input.categoryId ?? null,
    name: input.name,
    slug: input.slug,
    subtitle: input.subtitle ?? null,
    coverImage: input.coverImage ?? null,
    description: input.description ?? null,
    price: input.price,
    status: input.status,
    minBuy: input.minBuy,
    maxBuy: input.maxBuy,
    sort: input.sort,
    purchaseNote: input.purchaseNote ?? null,
  };

  if (input.id) {
    return prisma.product.update({
      where: { id: input.id },
      data,
      include: {
        category: true,
      },
    });
  }

  return prisma.product.create({
    data,
    include: {
      category: true,
    },
  });
}

export function deleteProductRecord(prisma: PrismaClient, id: number) {
  return prisma.product.delete({
    where: { id },
  });
}
