import { getContext } from "telefunc";
import { pinyin } from "pinyin-pro";
import type { PrismaClient } from "../../generated/prisma/client";
import { badRequestError, conflictError, notFoundError } from "../../lib/app-error";
import { validateCategoryInput } from "../../lib/validators/category";
import { validateProductInput } from "../../lib/validators/product";
import { getAdminContext, logAdminOperation } from "../auth/service";
import { getAdminProductDetail, getProductDetailBySlug, listAdminCategories, listAdminProducts, listHomeCategories, listHomeProducts } from "./queries";
import { deleteCategoryRecord, deleteProductRecord, updateCategoryStatus, upsertCategoryRecord, upsertProductRecord } from "./repository";

export async function getHomeCatalog(prisma?: PrismaClient) {
  const client = prisma ?? getCatalogContext().prisma;
  return {
    categories: await listHomeCategories(client),
    products: await listHomeProducts(client),
  };
}

function getCatalogContext() {
  return getContext<{ prisma: PrismaClient }>();
}

function slugify(input: string) {
  const pinyinStr = pinyin(input, { toneType: "none", nonZh: "consecutive" });
  return pinyinStr
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getAdminCategories(prisma?: PrismaClient) {
  const client = prisma ?? getCatalogContext().prisma;
  return listAdminCategories(client);
}

export async function saveCategory(input: {
  id?: number;
  name: string;
  slug?: string;
  description?: string;
  sort?: number;
}) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const { name } = validateCategoryInput(input);

  const slug = slugify(input.slug?.trim() || name);
  if (!slug) {
    throw badRequestError("分类 slug 不能为空", "CATEGORY_SLUG_REQUIRED");
  }

  let record;
  try {
    record = await upsertCategoryRecord(prisma, {
      id: input.id,
      name,
      slug,
      description: input.description?.trim() || null,
      sort: Number.isFinite(input.sort) ? Number(input.sort) : 0,
    });
  } catch (e: any) {
    if (e?.code === "P2002") throw conflictError("分类名称或 Slug 已存在，请换一个", "CATEGORY_SLUG_CONFLICT");
    throw e;
  }

  await logAdminOperation(
    {
      action: input.id ? "UPDATE_CATEGORY" : "CREATE_CATEGORY",
      targetType: "Category",
      targetId: String(record.id),
      detail: `name=${record.name}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    sort: record.sort,
    status: record.status,
  };
}

export async function toggleCategoryStatus(input: { id: number; status: "ACTIVE" | "DISABLED" }) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const record = await updateCategoryStatus(prisma, input.id, input.status);

  await logAdminOperation(
    {
      action: "TOGGLE_CATEGORY_STATUS",
      targetType: "Category",
      targetId: String(record.id),
      detail: `status=${record.status}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return {
    id: record.id,
    status: record.status,
  };
}

export async function deleteCategory(input: { id: number }) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const category = await prisma.category.findUnique({
    where: { id: input.id },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!category) {
    throw notFoundError("分类不存在", "CATEGORY_NOT_FOUND");
  }

  if (category._count.products > 0) {
    throw conflictError("分类下仍有关联商品，无法删除，请先调整这些商品", "CATEGORY_HAS_PRODUCTS");
  }

  await deleteCategoryRecord(prisma, input.id);

  await logAdminOperation(
    {
      action: "DELETE_CATEGORY",
      targetType: "Category",
      targetId: String(category.id),
      detail: `name=${category.name}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return {
    id: input.id,
  };
}

export async function getAdminProducts(prisma?: PrismaClient) {
  const client = prisma ?? getCatalogContext().prisma;
  return listAdminProducts(client);
}

export async function getAdminProductById(id: number, prisma?: PrismaClient) {
  const client = prisma ?? getCatalogContext().prisma;
  return getAdminProductDetail(client, id);
}

export async function getProductBySlug(slug: string, prisma?: PrismaClient) {
  const client = prisma ?? getCatalogContext().prisma;
  return getProductDetailBySlug(client, slug);
}

export async function saveProduct(input: {
  id?: number;
  categoryId?: number | null;
  name: string;
  slug?: string;
  subtitle?: string;
  coverImage?: string;
  description?: string;
  price: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  minBuy: number;
  maxBuy: number;
  sort?: number;
  purchaseNote?: string;
}) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const { name } = validateProductInput(input);

  const slug = slugify(input.slug?.trim() || name);
  if (!slug) {
    throw badRequestError("商品 slug 不能为空", "PRODUCT_SLUG_REQUIRED");
  }

  const minBuy = Number.isFinite(input.minBuy) ? Math.max(1, Math.floor(input.minBuy)) : 1;
  const maxBuy = Number.isFinite(input.maxBuy) ? Math.max(minBuy, Math.floor(input.maxBuy)) : minBuy;

  const record = await upsertProductRecord(prisma, {
    id: input.id,
    categoryId: input.categoryId ?? null,
    name,
    slug,
    subtitle: input.subtitle?.trim() || null,
    coverImage: input.coverImage?.trim() || null,
    description: input.description?.trim() || null,
    price: Math.floor(input.price),
    status: input.status,
    minBuy,
    maxBuy,
    sort: Number.isFinite(input.sort) ? Math.floor(input.sort ?? 0) : 0,
    purchaseNote: input.purchaseNote?.trim() || null,
  });

  await logAdminOperation(
    {
      action: input.id ? "UPDATE_PRODUCT" : "CREATE_PRODUCT",
      targetType: "Product",
      targetId: String(record.id),
      detail: `name=${record.name}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return {
    id: record.id,
    categoryId: record.categoryId,
    categoryName: record.category?.name ?? null,
    name: record.name,
    slug: record.slug,
    subtitle: record.subtitle,
    coverImage: record.coverImage,
    description: record.description,
    price: record.price,
    status: record.status,
    minBuy: record.minBuy,
    maxBuy: record.maxBuy,
    sort: record.sort,
    purchaseNote: record.purchaseNote,
  };
}

export async function deleteProduct(input: { id: number }) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const product = await prisma.product.findUnique({
    where: { id: input.id },
    include: {
      _count: {
        select: {
          cards: true,
          orders: true,
        },
      },
    },
  });

  if (!product) {
    throw notFoundError("商品不存在", "PRODUCT_NOT_FOUND");
  }

  if (product._count.orders > 0) {
    throw conflictError("商品已有历史订单，无法删除，建议改为下架", "PRODUCT_HAS_ORDERS");
  }

  if (product._count.cards > 0) {
    throw conflictError("商品仍有关联卡密库存，无法删除，请先清空库存", "PRODUCT_HAS_CARDS");
  }

  await deleteProductRecord(prisma, input.id);

  await logAdminOperation(
    {
      action: "DELETE_PRODUCT",
      targetType: "Product",
      targetId: String(product.id),
      detail: `name=${product.name}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return {
    id: input.id,
  };
}
