import type { PrismaClient } from "../../generated/prisma/client";
import { getErrorMessage } from "../../lib/app-error";
import { logger } from "../../lib/logger";
import { notifyDeliveryFailed, notifyDeliverySuccess } from "../email/service";
import { conflictError, notFoundError } from "../../lib/app-error";
import { allocateCardsForOrder } from "../inventory/allocator";
import { updateOrderDeliveryState } from "../order/repository";

export async function deliverOrder(prisma: PrismaClient, orderNo: string) {
  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: {
      product: true,
      deliveries: true,
    },
  });

  if (!order) {
    throw notFoundError("订单不存在", "ORDER_NOT_FOUND");
  }

  if (order.deliveryStatus === "DELIVERED") {
    return {
      success: true,
      items: order.deliveries.map((item) => item.contentSnapshot),
    };
  }

  if (order.paymentStatus !== "PAID") {
    throw conflictError("订单尚未支付", "ORDER_NOT_PAID");
  }

  try {
    const cards = await allocateCardsForOrder(prisma, order.id, order.productId, order.quantity);
    const contents = cards.map((card) => card.content);

    await prisma.orderDelivery.create({
      data: {
        orderId: order.id,
        deliveryType: "CARD",
        contentSnapshot: JSON.stringify(contents),
        status: "SUCCESS",
      },
    });

    await updateOrderDeliveryState(prisma, order.orderNo, {
      status: "DELIVERED",
      deliveryStatus: "DELIVERED",
      deliveredAt: new Date(),
    });

    if (order.contactType === "EMAIL" && order.contactValue) {
      try {
        await notifyDeliverySuccess({
          prisma,
          orderId: order.id,
          orderNo: order.orderNo,
          queryToken: order.queryToken,
          productName: order.productNameSnapshot,
          quantity: order.quantity,
          items: contents,
          toEmail: order.contactValue,
        });
      } catch (error) {
        logger.error(error instanceof Error ? error : String(error), {
          event: "email.delivery_success.failed",
          orderNo: order.orderNo,
        });
      }
    }

    return {
      success: true,
      items: contents,
    };
  } catch (error) {
    await prisma.orderDelivery.create({
      data: {
        orderId: order.id,
        deliveryType: "CARD",
        contentSnapshot: error instanceof Error ? error.message : "delivery failed",
        status: "FAILED",
      },
    });

    await updateOrderDeliveryState(prisma, order.orderNo, {
      status: "FAILED",
      deliveryStatus: "FAILED",
      deliveredAt: null,
    });

    if (order.contactType === "EMAIL" && order.contactValue) {
      try {
        await notifyDeliveryFailed({
          prisma,
          orderId: order.id,
          orderNo: order.orderNo,
          queryToken: order.queryToken,
          productName: order.productNameSnapshot,
          toEmail: order.contactValue,
          errorMessage: getErrorMessage(error, "delivery failed"),
        });
      } catch (emailError) {
        logger.error(emailError instanceof Error ? emailError : String(emailError), {
          event: "email.delivery_failed.failed",
          orderNo: order.orderNo,
        });
      }
    }

    throw error;
  }
}

export async function redeliverOrder(prisma: PrismaClient, orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw notFoundError("订单不存在", "ORDER_NOT_FOUND");
  }

  if (order.paymentStatus !== "PAID") {
    throw conflictError("订单未支付，无法补发", "ORDER_NOT_PAID");
  }

  if (order.deliveryStatus === "DELIVERED") {
    throw conflictError("订单已发货，无需补发", "ORDER_ALREADY_DELIVERED");
  }

  return deliverOrder(prisma, order.orderNo);
}
