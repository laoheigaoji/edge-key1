import { badRequestError } from "../app-error";
import { isEmail } from "./email";

export function validateOrderInput(input: {
  quantity?: number;
  contactValue?: string;
}) {
  if (!Number.isFinite(input.quantity) || (input.quantity ?? 0) < 1) {
    throw badRequestError("购买数量不合法", "ORDER_QUANTITY_INVALID");
  }

  const contactValue = input.contactValue?.trim() || "";
  if (!contactValue) {
    throw badRequestError("联系邮箱不能为空", "CONTACT_EMAIL_REQUIRED");
  }

  if (!isEmail(contactValue)) {
    throw badRequestError("联系邮箱格式不正确", "CONTACT_EMAIL_INVALID");
  }

  return {
    contactValue,
  };
}
