import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNotificationsRequest,
  markAllNotificationsAsReadRequest,
  markNotificationAsReadRequest,
} from "@/lib/notification-api";
import {
  decorateNotification,
  type NotificationsResponse,
} from "@/lib/notification-store";

export function syncNotificationCaches(
  queryClient: QueryClient,
  userId: string,
  notification: ReturnType<typeof decorateNotification>,
) {
  queryClient.setQueryData<NotificationsResponse>(
    ["notifications", userId],
    (current) => {
      const nextNotifications = [
        notification,
        ...(current?.notifications ?? []).filter((entry) => entry.id !== notification.id),
      ].slice(0, 50);

      return {
        notifications: nextNotifications,
        unreadCount: nextNotifications.filter((entry) => entry.unread).length,
      };
    },
  );
}

export function useNotificationsQuery(userId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["notifications", userId],
    enabled,
    queryFn: getNotificationsRequest,
  });
}

export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationAsReadRequest(notificationId),
    onSuccess: (notification) => {
      queryClient.setQueriesData<NotificationsResponse>(
        { queryKey: ["notifications"] },
        (current) => {
          const notifications = (current?.notifications ?? []).map((entry) =>
            entry.id === notification.id ? notification : entry,
          );

          return {
            notifications,
            unreadCount: notifications.filter((entry) => entry.unread).length,
          };
        },
      );
    },
  });
}

export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsReadRequest(),
    onSuccess: (data) => {
      queryClient.setQueriesData({ queryKey: ["notifications"] }, data);
    },
  });
}
