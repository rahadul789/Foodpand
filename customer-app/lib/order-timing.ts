import type { Order } from "@/lib/customer-data";

function toValidTime(value?: string) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function getDisplayOrderCode(order: Pick<Order, "orderCode" | "id">) {
  return order.orderCode || `FD-${order.id.slice(-8).toUpperCase()}`;
}

export function getDynamicPrepareRange(
  order: Pick<Order, "status" | "prepareMinMinutes" | "prepareMaxMinutes" | "restaurantAcceptedAt" | "estimatedReadyAt">,
  nowMs = Date.now(),
) {
  if (
    order.status !== "Preparing" ||
    !order.prepareMinMinutes ||
    !order.prepareMaxMinutes ||
    !order.restaurantAcceptedAt
  ) {
    return null;
  }

  const acceptedAtMs = toValidTime(order.restaurantAcceptedAt);
  if (!acceptedAtMs) {
    return null;
  }

  const elapsedMinutes = Math.max(0, Math.floor((nowMs - acceptedAtMs) / 60000));
  const elapsedFiveMinuteBlock = Math.floor(elapsedMinutes / 5) * 5;
  const minMinutes = Math.max(0, order.prepareMinMinutes - elapsedFiveMinuteBlock);
  const maxMinutes = Math.max(0, order.prepareMaxMinutes - elapsedFiveMinuteBlock);
  const estimatedReadyAtMs = toValidTime(order.estimatedReadyAt);
  const remainingMs = estimatedReadyAtMs ? estimatedReadyAtMs - nowMs : null;
  const delayed = remainingMs !== null ? remainingMs < 0 : false;
  const remainingMinutes =
    remainingMs !== null ? Math.max(0, Math.ceil(remainingMs / 60000)) : maxMinutes;

  return {
    minMinutes,
    maxMinutes,
    delayed,
    remainingMinutes,
    displayLabel:
      minMinutes === maxMinutes ? `${minMinutes} min` : `${minMinutes}-${maxMinutes} min`,
  };
}

export function formatTimeLabel(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  });
}
