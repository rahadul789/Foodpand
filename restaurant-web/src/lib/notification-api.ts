import { apiGet, apiPatch } from "./api";

export type OwnerNotification = {
  id: string;
  category: "orders" | "offers" | "payments" | "account" | "support";
  title: string;
  body: string;
  unread: boolean;
  target?: string;
  targetOrderId?: string;
  createdAt: string;
  readAt?: string;
};

export type OwnerNotificationsResponse = {
  notifications: OwnerNotification[];
  unreadCount: number;
};

export async function getOwnerNotificationsRequest(token: string) {
  const response = await apiGet<OwnerNotificationsResponse>("/api/v1/notifications", token);
  return response.data;
}

export async function markOwnerNotificationReadRequest(
  token: string,
  notificationId: string,
) {
  const response = await apiPatch<OwnerNotification>(
    `/api/v1/notifications/${notificationId}/read`,
    undefined,
    token,
  );
  return response.data;
}

export async function markAllOwnerNotificationsReadRequest(token: string) {
  const response = await apiPatch<OwnerNotificationsResponse>(
    "/api/v1/notifications/read-all",
    undefined,
    token,
  );
  return response.data;
}
