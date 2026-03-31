import { create } from "zustand";

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
  timeLabel: string;
  unread: boolean;
  icon:
    | "bicycle-outline"
    | "pricetag-outline"
    | "card-outline"
    | "person-outline"
    | "chatbubble-ellipses-outline";
  color: string;
};

const initialNotifications: AppNotification[] = [
  {
    id: "notif-1",
    category: "orders",
    title: "Your rider is almost there",
    body: "Urban Bites Sheikh-para order is close. Keep your phone nearby for the arrival call.",
    timeLabel: "2 min ago",
    unread: true,
    icon: "bicycle-outline",
    color: "#FFE3D8",
  },
  {
    id: "notif-2",
    category: "offers",
    title: "Flat TK 60 off is live nearby",
    body: "A nearby restaurant just turned on a voucher. Open the app to grab the deal while it lasts.",
    timeLabel: "18 min ago",
    unread: true,
    icon: "pricetag-outline",
    color: "#FFF1CC",
  },
  {
    id: "notif-3",
    category: "payments",
    title: "Payment method updated",
    body: "Cash on delivery is currently your selected payment method. You can switch to bKash anytime.",
    timeLabel: "1 hour ago",
    unread: false,
    icon: "card-outline",
    color: "#E8EDFF",
  },
  {
    id: "notif-4",
    category: "payments",
    title: "Refund completed",
    body: "The refund for your canceled order has been approved and processed successfully.",
    timeLabel: "Yesterday",
    unread: true,
    icon: "card-outline",
    color: "#E0F4D7",
  },
  {
    id: "notif-5",
    category: "account",
    title: "New login detected",
    body: "Your account was opened on a new device recently. Review your profile details if this was not you.",
    timeLabel: "Yesterday",
    unread: false,
    icon: "person-outline",
    color: "#FFE8F0",
  },
  {
    id: "notif-6",
    category: "support",
    title: "Support replied to your issue",
    body: "Foodbela support sent an update about your missing-item report. Open Help Center to continue.",
    timeLabel: "2 days ago",
    unread: true,
    icon: "chatbubble-ellipses-outline",
    color: "#E8EDFF",
  },
  {
    id: "notif-7",
    category: "orders",
    title: "Order delivered successfully",
    body: "Your Napoli Noir order was marked delivered. Rate it later from your orders screen.",
    timeLabel: "3 days ago",
    unread: false,
    icon: "bicycle-outline",
    color: "#FFF1CC",
  },
  {
    id: "notif-8",
    category: "offers",
    title: "Threshold offer unlocked at a favorite restaurant",
    body: "One of your featured restaurants now has a restaurant-specific basket discount available.",
    timeLabel: "4 days ago",
    unread: false,
    icon: "pricetag-outline",
    color: "#FFE3D8",
  },
];

type NotificationState = {
  notifications: AppNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initialNotifications,
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification,
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        unread: false,
      })),
    })),
}));

export function getUnreadNotificationCount(notifications: AppNotification[]) {
  return notifications.filter((notification) => notification.unread).length;
}
