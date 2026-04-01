import { apiGet, apiPatch } from "@/lib/api-client";

export type DeliveryOrderStatus =
  | "Pending acceptance"
  | "Preparing"
  | "Ready for pickup"
  | "On the way"
  | "Delivered"
  | "Cancelled";

export type DeliveryOrder = {
  id: string;
  orderCode?: string;
  restaurantId: string;
  restaurantName: string;
  status: DeliveryOrderStatus;
  eta: string;
  total: number;
  deliveryAddress: string;
  deliveryLocation?: {
    label?: string;
    subtitle?: string;
    latitude: number;
    longitude: number;
  };
  placedAt?: string;
  riderName?: string;
  deliveryTransportMode?: "bicycle" | "motorbike" | "car";
  prepareMinMinutes?: number;
  prepareMaxMinutes?: number;
  estimatedReadyAt?: string;
  deliveryAcceptedAt?: string;
  deliveryLiveLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    updatedAt?: string;
  };
};

export async function getAvailableDeliveryOrders(token: string) {
  const response = await apiGet<DeliveryOrder[]>("/api/v1/orders/delivery/available", token);
  return response.data;
}

export async function getAssignedDeliveryOrders(token: string) {
  const response = await apiGet<DeliveryOrder[]>("/api/v1/orders/delivery/assigned", token);
  return response.data;
}

export async function acceptDeliveryOrder(orderId: string, token: string) {
  const response = await apiPatch<DeliveryOrder>(
    `/api/v1/orders/${orderId}/assign-delivery`,
    undefined,
    token,
  );
  return response.data;
}

export async function updateDeliveryOrderStatus(
  orderId: string,
  payload: {
    status: "On the way" | "Delivered";
  },
  token: string,
) {
  const response = await apiPatch<DeliveryOrder>(
    `/api/v1/orders/${orderId}/status`,
    payload,
    token,
  );
  return response.data;
}

export async function updateDeliveryOrderLocation(
  orderId: string,
  payload: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
  },
  token: string,
) {
  const response = await apiPatch<DeliveryOrder>(
    `/api/v1/orders/${orderId}/location`,
    payload,
    token,
  );
  return response.data;
}
