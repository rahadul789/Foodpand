import { apiGet, apiPost } from "@/lib/api-client";

export type DeliveryUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "restaurant_owner" | "delivery_partner" | "admin";
  location: string;
  loyaltyPoints: number;
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
