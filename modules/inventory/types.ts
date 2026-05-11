export interface CardImportInput {
  productId: number;
  lines: string;
}

export interface AdminCardSummary {
  id: number;
  productId: number;
  productName: string;
  status: "UNUSED" | "LOCKED" | "SOLD" | "DISABLED";
  batchNo?: string | null;
  orderId?: number | null;
  soldAt?: string | null;
  createdAt: string;
  contentPreview: string;
}
