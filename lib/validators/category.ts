import { badRequestError } from "../app-error";

export function validateCategoryInput(input: {
  name?: string;
  slug?: string;
  sort?: number;
}) {
  const name = input.name?.trim() || "";
  if (!name) {
    throw badRequestError("分类名称不能为空", "CATEGORY_NAME_REQUIRED");
  }

  if (input.sort !== undefined && !Number.isFinite(input.sort)) {
    throw badRequestError("分类排序必须是数字", "CATEGORY_SORT_INVALID");
  }

  return {
    name,
    slug: input.slug?.trim() || "",
    sort: input.sort,
  };
}
