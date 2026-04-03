import { apiGet, apiPost } from "@/lib/api-client";
import { apiDelete, apiPatch } from "@/lib/api-client";

export type DeliveryUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "restaurant_owner" | "delivery_partner" | "admin";
  location: string;
  loyaltyPoints: number;
  deliveryTransportMode?: "bicycle" | "motorbike" | "car";
  deliveryAvailability?: {
    isOnline: boolean;
    acceptsNewOrders: boolean;
    lastSeenAt?: string;
  };
};

type AuthResponse = {
  user: DeliveryUser;
  accessToken: string;
};

export async function loginDeliveryPartner(payload: {
  email: string;
  password: string;
}) {
  const response = await apiPost<AuthResponse>("/api/v1/auth/login", payload);
  return response.data;
}

export async function getDeliveryMe(token: string) {
  const response = await apiGet<DeliveryUser>("/api/v1/users/me", token);
  return response.data;
}

export async function registerDeliveryPushTokenRequest(
  payload: {
    token: string;
    platform: "android" | "ios";
    appId: string;
  },
  token: string,
) {
  const response = await apiPost<{ registered: boolean }>(
    "/api/v1/users/push-token",
    payload,
    token,
  );
  return response.data;
}

export async function unregisterDeliveryPushTokenRequest(
  payload: {
    token: string;
    appId: string;
  },
  token: string,
) {
  const response = await apiDelete<{ removed: boolean }>(
    "/api/v1/users/push-token",
    payload,
    token,
  );
  return response.data;
}

export async function updateDeliveryPresenceRequest(
  payload: {
    isOnline?: boolean;
    acceptsNewOrders?: boolean;
    latitude?: number;
    longitude?: number;
    label?: string;
    subtitle?: string;
    deliveryTransportMode?: "bicycle" | "motorbike" | "car";
  },
  token: string,
) {
  const response = await apiPatch<DeliveryUser>(
    "/api/v1/users/delivery-presence",
    payload,
    token,
  );
  return response.data;
}
