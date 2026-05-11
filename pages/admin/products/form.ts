export interface ProductFormState {
  id?: number;
  categoryId: string;
  name: string;
  slug: string;
  subtitle: string;
  coverImage: string;
  description: string;
  price: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  minBuy: number;
  maxBuy: number;
  sort: number;
  purchaseNote: string;
}

export function createProductFormState(input?: Partial<ProductFormState>): ProductFormState {
  return {
    id: input?.id,
    categoryId: input?.categoryId ?? "",
    name: input?.name ?? "",
    slug: input?.slug ?? "",
    subtitle: input?.subtitle ?? "",
    coverImage: input?.coverImage ?? "",
    description: input?.description ?? "",
    price: input?.price ?? 0,
    status: input?.status ?? "DRAFT",
    minBuy: input?.minBuy ?? 1,
    maxBuy: input?.maxBuy ?? 1,
    sort: input?.sort ?? 0,
    purchaseNote: input?.purchaseNote ?? "",
  };
}
