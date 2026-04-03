import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/lib/auth-store";
import {
  type AppNotificationCategory,
} from "@/lib/notification-store";
import {
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationsQuery,
} from "@/lib/notification-queries";

type NotificationFilter = "all" | "unread" | AppNotificationCategory;

const filters: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "orders", label: "Orders" },
  { id: "offers", label: "Offers" },
  { id: "payments", label: "Payments" },
  { id: "account", label: "Account" },
  { id: "support", label: "Support" },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useNotificationsQuery(user?.id ?? null, Boolean(user?.id));
  const unreadCount = data?.unreadCount ?? 0;
  const markAsReadMutation = useMarkNotificationAsReadMutation();
  const markAllAsReadMutation = useMarkAllNotificationsAsReadMutation();
  const [selectedFilter, setSelectedFilter] = useState<NotificationFilter>("all");

  const filteredNotifications = useMemo(() => {
    return (data?.notifications ?? []).filter((notification) => {
      if (selectedFilter === "all") {
        return true;
      }

      if (selectedFilter === "unread") {
        return notification.unread;
      }

      return notification.category === selectedFilter;
    });
  }, [data?.notifications, selectedFilter]);

  const handleOpenNotification = (
    id: string,
    category: AppNotificationCategory,
    target?: string,
    targetOrderId?: string,
  ) => {
    if (!markAsReadMutation.isPending) {
      void markAsReadMutation.mutateAsync(id);
    }

    if (target === "order" && targetOrderId) {
      router.push(`/order/${targetOrderId}`);
      return;
    }

    if (category === "orders") {
      router.push("/(tabs)/orders");
      return;
    }

    if (category === "offers") {
      router.push("/(tabs)/home");
      return;
    }

    if (category === "payments") {
      router.push("/payment-methods");
      return;
    }

    if (category === "support") {
      router.push("/help-center");
      return;
    }

    router.push("/(tabs)/profile");
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar style="dark" backgroundColor="#FFF7F2" />
        <View style={styles.guestWrap}>
          <View style={styles.guestBubble}>
            <Ionicons name="notifications-outline" size={28} color="#20263A" />
          </View>
          <Text style={styles.guestTitle}>Login to view notifications</Text>
          <Text style={styles.guestText}>
            Order updates, offers, payments and support alerts will appear here after login.
          </Text>
          <Pressable
            style={styles.guestButton}
            onPress={() =>
              router.push({
                pathname: "/login",
                params: { redirectTo: "/notifications" },
              })
            }
          >
            <Text style={styles.guestButtonText}>Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#20263A" />
          </Pressable>
          <Text style={styles.topTitle}>Notifications</Text>
          <Pressable
            style={styles.markAllButton}
            onPress={() => void markAllAsReadMutation.mutateAsync()}
          >
            <Text style={styles.markAllButtonText}>Mark all</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />
          <Text style={styles.heroTitle}>Stay updated in one place</Text>
          <Text style={styles.heroText}>
            Orders, offers, refunds, account security and support replies will land here.
          </Text>
          <View style={styles.heroPill}>
            <Ionicons name="notifications-outline" size={14} color="#24314A" />
            <Text style={styles.heroPillText}>
              {unreadCount} unread
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((filter) => {
            const active = selectedFilter === filter.id;

            return (
              <Pressable
                key={filter.id}
                style={[
                  styles.filterChip,
                  active && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.list}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={styles.skeletonCard}>
                <View style={styles.skeletonIcon} />
                <View style={styles.skeletonCopy}>
                  <View style={styles.skeletonTitle} />
                  <View style={styles.skeletonBody} />
                  <View style={styles.skeletonBodyShort} />
                </View>
              </View>
            ))}
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={26} color="#24314A" />
            </View>
            <Text style={styles.emptyTitle}>Nothing here right now</Text>
            <Text style={styles.emptyText}>
              New updates will show up here as soon as they happen.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredNotifications.map((notification) => (
              <Pressable
                key={notification.id}
                style={[
                  styles.card,
                  notification.unread && styles.cardUnread,
                ]}
                onPress={() =>
                  handleOpenNotification(
                    notification.id,
                    notification.category,
                    notification.target,
                    notification.targetOrderId,
                  )
                }
              >
                <View
                  style={[
                    styles.cardIconWrap,
                    { backgroundColor: notification.color },
                  ]}
                >
                  <Ionicons
                    name={notification.icon}
                    size={18}
                    color="#24314A"
                  />
                </View>
                <View style={styles.cardCopy}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{notification.title}</Text>
                    <Text style={styles.cardTime}>{notification.timeLabel}</Text>
                  </View>
                  <Text style={styles.cardBody}>{notification.body}</Text>
                  <View style={styles.cardBottom}>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>
                        {notification.category}
                      </Text>
                    </View>
                    {notification.unread ? (
                      <View style={styles.unreadDot} />
                    ) : null}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F2",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 128,
    gap: 20,
  },
  topRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  topTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    color: "#20263A",
    textAlign: "center",
  },
  markAllButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#24314A",
  },
  heroCard: {
    borderRadius: 30,
    padding: 20,
    overflow: "hidden",
    backgroundColor: "#E8EDFF",
    gap: 10,
  },
  heroGlowOne: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#7BDFF2",
    opacity: 0.22,
    top: -60,
    right: -34,
  },
  heroGlowTwo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFD166",
    opacity: 0.28,
    bottom: -16,
    left: -18,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
    color: "#20263A",
    maxWidth: 280,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6F6A77",
    maxWidth: 300,
  },
  heroPill: {
    marginTop: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24314A",
  },
  filterRow: {
    gap: 10,
    paddingRight: 18,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F4F0EB",
  },
  filterChipActive: {
    backgroundColor: "#20263A",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24314A",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  list: {
    gap: 12,
  },
  skeletonCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  skeletonIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#F2EBE4",
  },
  skeletonCopy: {
    flex: 1,
    gap: 8,
  },
  skeletonTitle: {
    width: "58%",
    height: 16,
    borderRadius: 999,
    backgroundColor: "#EFE7DE",
  },
  skeletonBody: {
    width: "96%",
    height: 12,
    borderRadius: 999,
    backgroundColor: "#F3ECE5",
  },
  skeletonBodyShort: {
    width: "64%",
    height: 12,
    borderRadius: 999,
    backgroundColor: "#F3ECE5",
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: "#E8EDFF",
    backgroundColor: "#FCFDFF",
  },
  cardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: {
    flex: 1,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#20263A",
  },
  cardTime: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8A7E75",
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6F6A77",
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F4F0EB",
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#24314A",
    textTransform: "capitalize",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF5D8F",
  },
  emptyCard: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 34,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#20263A",
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#7B6F69",
    textAlign: "center",
  },
  guestWrap: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  guestBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#20263A",
    textAlign: "center",
  },
  guestText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#7B6F69",
    textAlign: "center",
  },
  guestButton: {
    minHeight: 54,
    paddingHorizontal: 22,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5D8F",
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
