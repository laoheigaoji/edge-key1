export interface ProductSummary {
  id: number;
  categoryId?: number | null;
  categoryName?: string | null;
  name: string;
  slug: string;
  coverImage?: string | null;
  price: number;
  stockMode: "FINITE" | "UNLIMITED";
  availableStock: number;
}

export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  sort: number;
  status: "ACTIVE" | "DISABLED";
}

export interface AdminProductSummary {
  id: number;
  name: string;
  slug: string;
  subtitle?: string | null;
  coverImage?: string | null;
  price: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  minBuy: number;
  maxBuy: number;
  sort: number;
  categoryId?: number | null;
  categoryName?: string | null;
}
