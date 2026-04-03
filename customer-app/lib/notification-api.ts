import { apiGet, apiPatch } from "@/lib/api-client";
import {
  decorateNotification,
  decorateNotificationsResponse,
  type AppNotification,
  type AppNotificationCategory,
  type NotificationsResponse,
} from "@/lib/notification-store";

type NotificationDto = {
  id: string;
  category: AppNotificationCategory;
  title: string;
  body: string;
  unread: boolean;
  target: string;
  targetOrderId?: string;
  createdAt: string;
  readAt?: string;
};

type NotificationsResponseDto = {
  notifications: NotificationDto[];
  unreadCount: number;
};

export async function getNotificationsRequest() {
  const response = await apiGet<NotificationsResponseDto>("/api/v1/notifications");
  return decorateNotificationsResponse(response.data);
}

export async function markNotificationAsReadRequest(notificationId: string) {
  const response = await apiPatch<NotificationDto>(
    `/api/v1/notifications/${notificationId}/read`,
  );
  return decorateNotification(response.data) as AppNotification;
}

export async function markAllNotificationsAsReadRequest() {
  const response = await apiPatch<NotificationsResponseDto>(
    "/api/v1/notifications/read-all",
  );
  return decorateNotificationsResponse(response.data) as NotificationsResponse;
}
