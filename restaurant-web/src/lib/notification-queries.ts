import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "./auth";
import {
  getOwnerNotificationsRequest,
  markAllOwnerNotificationsReadRequest,
  markOwnerNotificationReadRequest,
  type OwnerNotification,
  type OwnerNotificationsResponse,
} from "./notification-api";

function syncNotificationList(
  current: OwnerNotificationsResponse | undefined,
  updater: (notifications: OwnerNotification[]) => OwnerNotification[],
) {
  const notifications = updater(current?.notifications ?? []);
  return {
    notifications,
    unreadCount: notifications.filter((notification) => notification.unread).length,
  };
}

export function useOwnerNotificationsQuery() {
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["owner", "notifications"],
    enabled: Boolean(token && isAuthenticated),
    queryFn: () => getOwnerNotificationsRequest(token as string),
    refetchInterval: 30_000,
  });
}

export function useMarkOwnerNotificationReadMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      markOwnerNotificationReadRequest(token as string, notificationId),
    onSuccess: (updated) => {
      queryClient.setQueryData<OwnerNotificationsResponse>(
        ["owner", "notifications"],
        (current) =>
          syncNotificationList(current, (notifications) =>
            notifications.map((notification) =>
              notification.id === updated.id ? updated : notification,
            ),
          ),
      );
    },
  });
}

export function useMarkAllOwnerNotificationsReadMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllOwnerNotificationsReadRequest(token as string),
    onSuccess: (result) => {
      queryClient.setQueryData(["owner", "notifications"], result);
    },
  });
}
