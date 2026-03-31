import { apiGet, apiPost } from "@/lib/api-client";

type AuthUserDto = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "restaurant_owner" | "delivery_partner" | "admin";
  location: string;
  loyaltyPoints: number;
};

type AuthResponseDto = {
  user: AuthUserDto;
  accessToken: string;
};

export type AuthPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export async function loginRequest(payload: AuthPayload) {
  const response = await apiPost<AuthResponseDto>("/api/v1/auth/login", payload);
  return response.data;
}

export async function signupRequest(payload: SignupPayload) {
  const response = await apiPost<AuthResponseDto>("/api/v1/auth/signup", payload);
  return response.data;
}

export async function getMeRequest(token?: string | null) {
  const response = await apiGet<AuthUserDto>("/api/v1/users/me", token);
  return response.data;
}
