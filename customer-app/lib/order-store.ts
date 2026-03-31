import { create } from "zustand";

import {
  activeOrder as seedActiveOrder,
  previousOrders as seedPreviousOrders,
  type Order,
  type Restaurant,
} from "@/lib/customer-data";
import type { PaymentMethodId } from "@/lib/payment-store";

type PlaceOrderCartItem = {
  cartKey: string;
  itemId: string;
  name: string;
  quantity: number;
  unitTk: number;
  summary?: string;
};

type PlaceOrderParams = {
  restaurant: Restaurant;
  items: PlaceOrderCartItem[];
  subtotalTk: number;
  deliveryTk: number;
  serviceFeeTk: number;
  discountTk: number;
  totalTk: number;
  paymentMethod: PaymentMethodId;
  deliveryAddress: string;
  note?: string;
};

type CancelResult = {
  ok: boolean;
  message: string;
};

type OrderState = {
  activeOrders: Order[];
  previousOrders: Order[];
  placeOrderFromCart: (
    params: PlaceOrderParams,
  ) => { ok: true; order: Order };
  cancelOrder: (id: string) => CancelResult;
  clearActiveOrder: (id?: string) => void;
};

function mapPaymentMethod(method: PaymentMethodId): Order["paymentMethod"] {
  return method === "bkash" ? "bKash" : "COD";
}

function createOrderId() {
  return `FD-${Date.now().toString().slice(-7)}`;
}

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
    case "On the way":
    case "Delivered":
      return 2;
    case "Cancelled":
    default:
      return 0;
  }
}

export const useOrderStore = create<OrderState>((set, get) => ({
  activeOrders: seedActiveOrder ? [seedActiveOrder] : [],
  previousOrders: [...seedPreviousOrders],
  placeOrderFromCart: (params) => {
    const orderId = createOrderId();
    const nextOrder: Order = {
      id: orderId,
      restaurantId: params.restaurant.id,
      restaurantName: params.restaurant.name,
      status: "Pending acceptance",
      eta: "Waiting for restaurant",
      total: params.totalTk,
      subtotalTk: params.subtotalTk,
      deliveryTk: params.deliveryTk,
      serviceFeeTk: params.serviceFeeTk,
      discountTk: params.discountTk,
      accent: params.restaurant.accent,
      icon: "time-outline",
      items: params.items.map((item) => item.name),
      lineItems: params.items.map((item) => ({
        id: `${orderId}-${item.cartKey}`,
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        unitTk: item.unitTk,
        summary: item.summary,
      })),
      paymentMethod: mapPaymentMethod(params.paymentMethod),
      placedAt: new Date().toISOString(),
      deliveryAddress: params.deliveryAddress,
      note: params.note,
      canTrack: false,
    };

    set((state) => ({ activeOrders: [nextOrder, ...state.activeOrders] }));
    return { ok: true, order: nextOrder };
  },
  cancelOrder: (id) => {
    const current = get().activeOrders.find((order) => order.id === id);

    if (!current) {
      return {
        ok: false,
        message: "This order is no longer available.",
      };
    }

    if (!isOrderCancelable(current)) {
      return {
        ok: false,
        message: "This order can no longer be cancelled.",
      };
    }

    const cancelledOrder: Order = {
      ...current,
      status: "Cancelled",
      eta: "Cancelled before acceptance",
      icon: "close-circle-outline",
      canTrack: false,
      riderName: undefined,
    };

    set((state) => ({
      activeOrders: state.activeOrders.filter((order) => order.id !== id),
      previousOrders: [cancelledOrder, ...state.previousOrders],
    }));

    return {
      ok: true,
      message: "Order cancelled before restaurant acceptance.",
    };
  },
  clearActiveOrder: (id) =>
    set((state) => ({
      activeOrders: id
        ? state.activeOrders.filter((order) => order.id !== id)
        : state.activeOrders.slice(1),
    })),
}));
