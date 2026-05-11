export function getOrderStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "待处理";
    case "PAID":
      return "已支付";
    case "DELIVERED":
      return "已发货";
    case "CLOSED":
      return "已关闭";
    case "FAILED":
      return "失败";
    default:
      return status;
  }
}

export function getPaymentStatusLabel(status: string) {
  switch (status) {
    case "UNPAID":
      return "未支付";
    case "PAID":
      return "已支付";
    case "FAILED":
      return "支付失败";
    default:
      return status;
  }
}

export function getDeliveryStatusLabel(status: string) {
  switch (status) {
    case "NOT_DELIVERED":
      return "未发货";
    case "DELIVERED":
      return "已发货";
    case "FAILED":
      return "发货失败";
    default:
      return status;
  }
}

export function getPaymentProviderLabel(provider: string) {
  switch (provider) {
    case "EPAY":
      return "易支付";
    case "BEPUSDT":
      return "BEpusdt";
    default:
      return provider;
  }
}

export function getOrderStatusType(status: string): "warning" | "success" | "primary" | "danger" | "default" {
  switch (status) {
    case "PENDING": return "warning";
    case "PAID": return "success";
    case "DELIVERED": return "success";
    case "CLOSED": return "default";
    case "FAILED": return "danger";
    default: return "default";
  }
}

export function getPaymentStatusType(status: string): "warning" | "success" | "danger" | "default" {
  switch (status) {
    case "UNPAID": return "warning";
    case "PAID": return "success";
    case "FAILED": return "danger";
    default: return "default";
  }
}

export function getDeliveryStatusType(status: string): "warning" | "success" | "danger" | "default" {
  switch (status) {
    case "NOT_DELIVERED": return "warning";
    case "DELIVERED": return "success";
    case "FAILED": return "danger";
    default: return "default";
  }
}

export function getVerifyStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "待校验";
    case "VERIFIED":
      return "已校验";
    case "FAILED":
      return "校验失败";
    default:
      return status;
  }
}

