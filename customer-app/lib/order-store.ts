import type { Order } from "@/lib/customer-data";

export function getResolvedOrder(order: Order | null | undefined) {
  return order ?? null;
}

export function isOrderCancelable(order: Order | null | undefined) {
  return getResolvedOrder(order)?.status === "Pending acceptance";
}

export function getOrderStatusStage(order: Order | null | undefined) {
  const resolvedOrder = getResolvedOrder(order);

  if (!resolvedOrder) {
    return -1;
  }

  switch (resolvedOrder.status) {
    case "Pending acceptance":
      return 0;
    case "Preparing":
      return 1;
    case "Ready for pickup":
      return 2;
    case "On the way":
    case "Delivered":
      return 3;
    case "Cancelled":
    default:
      return 0;
  }
}
