export type AppNotificationCategory =
  | "orders"
  | "offers"
  | "payments"
  | "account"
  | "support";

export type AppNotification = {
  id: string;
  category: AppNotificationCategory;
  title: string;
  body: string;
  unread: boolean;
  target: string;
  targetOrderId?: string;
  createdAt: string;
  readAt?: string;
  timeLabel: string;
  icon:
    | "bicycle-outline"
    | "pricetag-outline"
    | "card-outline"
    | "person-outline"
    | "chatbubble-ellipses-outline";
  color: string;
};

export type NotificationsResponse = {
  notifications: AppNotification[];
  unreadCount: number;
};

function getIcon(category: AppNotificationCategory): AppNotification["icon"] {
  if (category === "offers") {
    return "pricetag-outline";
  }

  if (category === "payments") {
    return "card-outline";
  }

  if (category === "account") {
    return "person-outline";
  }

  if (category === "support") {
    return "chatbubble-ellipses-outline";
  }

  return "bicycle-outline";
}

function getColor(category: AppNotificationCategory) {
  if (category === "offers") {
    return "#FFF1CC";
  }

  if (category === "payments") {
    return "#E8EDFF";
  }

  if (category === "account") {
    return "#FFE8F0";
  }

  if (category === "support") {
    return "#E8EDFF";
  }

  return "#FFE3D8";
}

export function formatNotificationTimeLabel(value: string) {
  const createdAt = new Date(value).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - createdAt);
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function decorateNotification<
  T extends {
    id: string;
    category: AppNotificationCategory;
    title: string;
    body: string;
    unread: boolean;
    target: string;
    targetOrderId?: string;
    createdAt: string;
    readAt?: string;
  },
>(notification: T): AppNotification {
  return {
    ...notification,
    timeLabel: formatNotificationTimeLabel(notification.createdAt),
    icon: getIcon(notification.category),
    color: getColor(notification.category),
  };
}

export function decorateNotificationsResponse(response: {
  notifications: Array<{
    id: string;
    category: AppNotificationCategory;
    title: string;
    body: string;
    unread: boolean;
    target: string;
    targetOrderId?: string;
    createdAt: string;
    readAt?: string;
  }>;
  unreadCount: number;
}): NotificationsResponse {
  return {
    unreadCount: response.unreadCount,
    notifications: response.notifications.map((notification) =>
      decorateNotification(notification),
    ),
  };
}

export function getUnreadNotificationCount(notifications: AppNotification[]) {
  return notifications.filter((notification) => notification.unread).length;
}
