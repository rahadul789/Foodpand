import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { Order } from "@/lib/customer-data";
import type { PaymentMethodId } from "@/lib/payment-store";

type OrderDto = {
  id: string;
  orderCode?: string;
  restaurantId: string;
  restaurantName: string;
  status: Order["status"];
  eta: string;
  total: number;
  subtotalTk: number;
  deliveryTk: number;
  serviceFeeTk: number;
  discountTk: number;
  couponCode?: string;
  appliedOffer?: {
    type: string;
    title: string;
    shortLabel?: string;
    code?: string;
    discountTk: number;
    freeDeliveryApplied?: boolean;
    isAutoApply?: boolean;
  };
  accent: string;
  icon: string;
  restaurantCoverImage?: string;
  items: string[];
  lineItems: Array<{
    id: string;
    itemId: string;
    name: string;
    quantity: number;
    unitTk: number;
    summary?: string;
  }>;
  paymentMethod: Order["paymentMethod"];
  placedAt: string;
  deliveryAddress: string;
  note?: string;
  canTrack?: boolean;
  riderName?: string;
  prepareMinMinutes?: number;
  prepareMaxMinutes?: number;
  estimatedReadyAt?: string;
  restaurantAcceptedAt?: string;
  readyForPickupAt?: string;
  deliveryAcceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  statusHistory?: Array<{
    status: Order["status"];
    actorRole: "customer" | "restaurant_owner" | "delivery_partner" | "admin";
    note?: string;
    createdAt: string;
  }>;
};

export type CreateOrderPayload = {
  restaurantId: string;
  items: Array<{
    itemId: string;
    quantity: number;
    unitTk: number;
    summary?: string;
  }>;
  subtotalTk: number;
  deliveryTk: number;
  serviceFeeTk: number;
  discountTk: number;
  totalTk: number;
  paymentMethod: PaymentMethodId;
  deliveryAddress: string;
  note?: string;
  couponCode?: string | null;
};

function mapOrder(dto: OrderDto): Order {
  return {
    id: dto.id,
    orderCode: dto.orderCode,
    restaurantId: dto.restaurantId,
    restaurantName: dto.restaurantName,
    status: dto.status,
    eta: dto.eta,
    total: dto.total,
    subtotalTk: dto.subtotalTk,
    deliveryTk: dto.deliveryTk,
    serviceFeeTk: dto.serviceFeeTk,
    discountTk: dto.discountTk,
    couponCode: dto.couponCode,
    appliedOffer: dto.appliedOffer,
    accent: dto.accent,
    icon: dto.icon,
    restaurantCoverImage: dto.restaurantCoverImage,
    items: dto.items,
    lineItems: dto.lineItems,
    paymentMethod: dto.paymentMethod,
    placedAt: dto.placedAt,
    deliveryAddress: dto.deliveryAddress,
    note: dto.note,
    canTrack: dto.canTrack,
    riderName: dto.riderName,
    prepareMinMinutes: dto.prepareMinMinutes,
    prepareMaxMinutes: dto.prepareMaxMinutes,
    estimatedReadyAt: dto.estimatedReadyAt,
    restaurantAcceptedAt: dto.restaurantAcceptedAt,
    readyForPickupAt: dto.readyForPickupAt,
    deliveryAcceptedAt: dto.deliveryAcceptedAt,
    pickedUpAt: dto.pickedUpAt,
    deliveredAt: dto.deliveredAt,
    statusHistory: dto.statusHistory,
  };
}

export async function getActiveOrdersRequest() {
  const response = await apiGet<OrderDto[]>("/api/v1/orders/active");
  return response.data.map(mapOrder);
}

export async function getOrderHistoryRequest() {
  const response = await apiGet<OrderDto[]>("/api/v1/orders/history");
  return response.data.map(mapOrder);
}

export async function getOrderDetailRequest(orderId: string) {
  const response = await apiGet<OrderDto>(`/api/v1/orders/${orderId}`);
  return mapOrder(response.data);
}

export async function createOrderRequest(payload: CreateOrderPayload) {
  const response = await apiPost<OrderDto>("/api/v1/orders", payload);
  return mapOrder(response.data);
}

export async function cancelOrderRequest(orderId: string) {
  const response = await apiPatch<OrderDto>(`/api/v1/orders/${orderId}/cancel`);
  return mapOrder(response.data);
}

export type OrderQuote = {
  subtotalTk: number;
  deliveryTk: number;
  serviceFeeTk: number;
  discountTk: number;
  totalTk: number;
  couponCode?: string | null;
  appliedOffer?: Order["appliedOffer"];
};

export type OrderQuotePayload = {
  restaurantId: string;
  items: Array<{
    itemId: string;
    quantity: number;
    unitTk: number;
    summary?: string;
  }>;
  couponCode?: string | null;
};

export async function getOrderQuoteRequest(payload: OrderQuotePayload) {
  const response = await apiPost<OrderQuote>("/api/v1/orders/quote", payload);
  return response.data;
}
