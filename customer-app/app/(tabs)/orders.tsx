import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OrdersScreenSkeleton } from "@/components/order-skeletons";
import { useAuthStore } from "@/lib/auth-store";
import type { Order } from "@/lib/customer-data";
import { getOrderStatusStage, getResolvedOrder } from "@/lib/order-store";
import { useCustomerOrderRealtime } from "@/lib/order-realtime";
import { getDisplayOrderCode } from "@/lib/order-timing";
import { useActiveOrdersQuery, useOrderHistoryQuery } from "@/lib/order-queries";

const orderSteps = [
  "Order placed",
  "Restaurant accepts",
  "Ready for pickup",
  "Delivery starts",
];

const previousOrderFilters = [
  { id: "all", label: "All", color: "#F4F0EB", icon: "grid-outline" },
  { id: "recent", label: "Recent", color: "#E8EDFF", icon: "time-outline" },
  { id: "offers", label: "Offers used", color: "#FFE8F0", icon: "ticket-outline" },
  { id: "big", label: "Big basket", color: "#FFF1CC", icon: "bag-handle-outline" },
] as const;

type PreviousOrderFilterId = (typeof previousOrderFilters)[number]["id"];

function formatPlacedAt(value: string) {
  const date = new Date(value);

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getHistoryStatusIcon(order: Order) {
  if (order.status === "Delivered") {
    return "checkmark";
  }

  if (order.status === "Cancelled") {
    return "close-outline";
  }

  return "time-outline";
}

function getStatusIcon(status: Order["status"]) {
  if (status === "Preparing") {
    return "time-outline";
  }

  if (status === "Ready for pickup") {
    return "restaurant-outline";
  }

  if (status === "On the way") {
    return "bicycle-outline";
  }

  if (status === "Delivered") {
    return "checkmark-circle-outline";
  }

  if (status === "Cancelled") {
    return "close-circle-outline";
  }

  return "radio-button-on-outline";
}

function AnimatedStatusBadge({
  status,
  label,
}: {
  status: Order["status"];
  label: string;
}) {
  const pulse = useRef(new Animated.Value(0.97)).current;
  const isLive = status !== "Delivered" && status !== "Cancelled";

  useEffect(() => {
    if (!isLive) {
      pulse.setValue(1);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.97,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [isLive, pulse]);

  return (
    <Animated.View
      style={[
        styles.liveBadge,
        status === "Delivered"
          ? styles.liveBadgeDelivered
          : status === "Cancelled"
            ? styles.liveBadgeCancelled
            : styles.liveBadgeActive,
        { transform: [{ scale: pulse }] },
      ]}
    >
      <Ionicons name={getStatusIcon(status)} size={13} color="#24314A" />
      <Text style={styles.liveBadgeText}>{label}</Text>
    </Animated.View>
  );
}

function AnimatedClockBlob() {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [drift]);

  return (
    <Animated.View
      style={[
        styles.heroClockBubble,
        {
          transform: [
            {
              translateY: drift.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -7],
              }),
            },
          ],
        },
      ]}
    >
      <Ionicons name="time-outline" size={24} color="#1E8E54" />
    </Animated.View>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useCustomerOrderRealtime(Boolean(user?.id));

  const { data: activeOrders = [], isLoading: activeLoading } = useActiveOrdersQuery(
    Boolean(user?.id),
  );
  const { data: previousOrders = [], isLoading: historyLoading } = useOrderHistoryQuery(
    Boolean(user?.id),
  );
  const [selectedFilter, setSelectedFilter] = useState<PreviousOrderFilterId>("all");

  const latestActiveOrder = useMemo(
    () => getResolvedOrder(activeOrders[0] ?? null),
    [activeOrders],
  );
  const otherActiveOrders = useMemo(() => activeOrders.slice(1), [activeOrders]);

  const filteredOrders = useMemo(() => {
    const now = new Date();

    return previousOrders.filter((order) => {
      if (selectedFilter === "recent") {
        const ageDays =
          (now.getTime() - new Date(order.placedAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return ageDays <= 14;
      }

      if (selectedFilter === "offers") {
        return order.discountTk > 0;
      }

      if (selectedFilter === "big") {
        return order.total >= 350;
      }

      return true;
    });
  }, [previousOrders, selectedFilter]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar style="dark" backgroundColor="#FFF7F2" />
        <View style={styles.guestWrap}>
          <View style={styles.guestBubble}>
            <Ionicons name="receipt-outline" size={28} color="#20263A" />
          </View>
          <Text style={styles.guestTitle}>Login to see your orders</Text>
          <Text style={styles.guestText}>
            Login first to view live orders, tracking, and previous history.
          </Text>
          <Pressable
            style={styles.guestButton}
            onPress={() =>
              router.push({
                pathname: "/login",
                params: { redirectTo: "/(tabs)/orders" },
              })
            }
          >
            <Text style={styles.guestButtonText}>Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (activeLoading || historyLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar style="dark" backgroundColor="#FFF7F2" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <OrdersScreenSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroBlobOne} />
          <View style={styles.heroBlobTwo} />
          <AnimatedClockBlob />
          <Text style={styles.heroTitle}>Orders</Text>

          {latestActiveOrder ? (
            <>
              <AnimatedStatusBadge
                status={latestActiveOrder.status}
                label={latestActiveOrder.status}
              />
              <Text style={styles.heroEta}>{latestActiveOrder.restaurantName}</Text>
              <Text style={styles.heroMeta}>
                {latestActiveOrder.eta} | {getDisplayOrderCode(latestActiveOrder)}
              </Text>

              <View style={styles.stepRow}>
                {orderSteps.map((step, index) => (
                  <View key={step} style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepDot,
                        {
                          backgroundColor:
                            index <= getOrderStatusStage(latestActiveOrder)
                              ? "#2FBF71"
                              : "#E6E0DB",
                        },
                      ]}
                    />
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={styles.trackButton}
                onPress={() =>
                  router.push({
                    pathname: "/order/[id]",
                    params: { id: latestActiveOrder.id },
                  })
                }
              >
                <Text style={styles.trackButtonText}>View live order</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.heroEta}>No active order</Text>
              <Text style={styles.heroMeta}>
                Place a fresh order to see live status here.
              </Text>
              <Pressable style={styles.trackButton} onPress={() => router.push("/(tabs)/discover")}>
                <Text style={styles.trackButtonText}>Browse restaurants</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </Pressable>
            </>
          )}
        </View>

        <SectionHeader
          title="Active order"
          action={activeOrders.length > 1 ? `${activeOrders.length} live` : "Now"}
        />

        {latestActiveOrder ? (
          <Pressable
            style={styles.activeCard}
            onPress={() =>
              router.push({
                pathname: "/order/[id]",
                params: { id: latestActiveOrder.id },
              })
            }
          >
            <View style={styles.activeTopRow}>
              <View style={styles.storeIcon}>
                <Ionicons
                  name={getStatusIcon(latestActiveOrder.status)}
                  size={18}
                  color="#24314A"
                />
              </View>
              <View style={styles.activeCopy}>
                <Text style={styles.activeName}>{latestActiveOrder.restaurantName}</Text>
                <Text style={styles.activeMeta}>{latestActiveOrder.items.join(" | ")}</Text>
              </View>
              <Text style={styles.activeTotal}>TK {latestActiveOrder.total}</Text>
            </View>

            <View style={styles.activePillRow}>
              <AnimatedStatusBadge
                status={latestActiveOrder.status}
                label={latestActiveOrder.status}
              />
              <View style={styles.activeInfoPill}>
                <Ionicons name="time-outline" size={13} color="#24314A" />
                <Text style={styles.activeInfoPillText}>{latestActiveOrder.eta}</Text>
              </View>
            </View>

            <View style={styles.activeFooter}>
              <Text style={styles.activeFooterText}>
                {latestActiveOrder.riderName
                  ? `Rider: ${latestActiveOrder.riderName} | ${latestActiveOrder.paymentMethod}`
                  : `${latestActiveOrder.paymentMethod} | Tap to open details`}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#9B9087" />
            </View>
          </Pressable>
        ) : (
          <View style={[styles.activeCard, styles.activeCardEmpty]}>
            <Text style={styles.activeName}>Nothing active right now</Text>
            <Text style={styles.activeMeta}>
              Your latest live order will appear here with the clearest status updates.
            </Text>
          </View>
        )}

        {otherActiveOrders.length > 0 ? (
          <>
            <SectionHeader title="Other active orders" action={`${otherActiveOrders.length} more`} />
            <View style={styles.secondaryActiveList}>
              {otherActiveOrders.map((order) => (
                <Pressable
                  key={order.id}
                  style={styles.secondaryActiveCard}
                  onPress={() =>
                    router.push({
                      pathname: "/order/[id]",
                      params: { id: order.id },
                    })
                  }
                >
                  <View style={styles.secondaryActiveLeft}>
                    <View style={styles.secondaryActiveIcon}>
                      <Ionicons name={getStatusIcon(order.status)} size={16} color="#24314A" />
                    </View>
                    <View style={styles.secondaryActiveCopy}>
                      <Text style={styles.secondaryActiveName}>{order.restaurantName}</Text>
                      <Text style={styles.secondaryActiveMeta}>{order.eta} | TK {order.total}</Text>
                    </View>
                  </View>
                  <AnimatedStatusBadge status={order.status} label={order.status} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <SectionHeader title="Previous orders" action={`${filteredOrders.length} found`} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {previousOrderFilters.map((filter) => {
            const active = selectedFilter === filter.id;

            return (
              <Pressable
                key={filter.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: active ? "#24314A" : filter.color },
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Ionicons
                  name={filter.icon as never}
                  size={14}
                  color={active ? "#FFFFFF" : "#24314A"}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? "#FFFFFF" : "#24314A" },
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.historyList}>
          {filteredOrders.map((order) => (
            <Pressable
              key={order.id}
              style={styles.historyCard}
              onPress={() =>
                router.push({
                  pathname: "/order/[id]",
                  params: { id: order.id },
                })
              }
            >
              <View style={styles.historyTopRow}>
                <View style={styles.historyBadge}>
                  <Ionicons name={getHistoryStatusIcon(order)} size={14} color="#24314A" />
                </View>
                <View style={styles.historyCopy}>
                  <Text style={styles.historyName}>{order.restaurantName}</Text>
                  <Text style={styles.historyMeta}>
                    {formatPlacedAt(order.placedAt)} | {getDisplayOrderCode(order)}
                  </Text>
                </View>
                <Text style={styles.historyTotal}>TK {order.total}</Text>
              </View>

              <Text style={styles.historyItems}>{order.items.join(" | ")}</Text>

              <View style={styles.historyBottomRow}>
                <View style={styles.historyPillRow}>
                  <View style={styles.historyPill}>
                    <Text style={styles.historyPillText}>{order.paymentMethod}</Text>
                  </View>
                  <View style={styles.historyPill}>
                    <Text style={styles.historyPillText}>Reorder available</Text>
                  </View>
                  {order.discountTk > 0 ? (
                    <View style={[styles.historyPill, styles.historyPillOffer]}>
                      <Text style={styles.historyPillOfferText}>Saved TK {order.discountTk}</Text>
                    </View>
                  ) : null}
                  {order.status === "Cancelled" ? (
                    <View style={[styles.historyPill, styles.historyPillCancelled]}>
                      <Text style={styles.historyPillCancelledText}>Cancelled</Text>
                    </View>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9B9087" />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionAction}>{action}</Text>
    </View>
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
    gap: 22,
  },
  heroCard: {
    backgroundColor: "#E4F8EA",
    borderRadius: 34,
    padding: 18,
    overflow: "hidden",
    marginTop: 4,
    gap: 10,
  },
  heroBlobOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#2FBF71",
    opacity: 0.18,
    top: -50,
    right: -46,
  },
  heroBlobTwo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFD166",
    opacity: 0.28,
    bottom: -26,
    left: -24,
  },
  heroClockBubble: {
    position: "absolute",
    right: 22,
    top: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.74)",
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#20263A",
  },
  heroEta: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: "900",
    color: "#1E8E54",
    paddingRight: 56,
  },
  heroMeta: {
    fontSize: 14,
    color: "#6E7A6A",
  },
  stepRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  stepItem: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stepText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24314A",
    textAlign: "center",
  },
  trackButton: {
    marginTop: 8,
    minHeight: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2FBF71",
    flexDirection: "row",
    gap: 8,
  },
  trackButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  liveBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  liveBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.76)",
  },
  liveBadgeDelivered: {
    backgroundColor: "#E7F8EE",
  },
  liveBadgeCancelled: {
    backgroundColor: "#FFE8E8",
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#24314A",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#20263A",
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "800",
    color: "#8A7E75",
  },
  activeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 16,
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 12,
  },
  activeCardEmpty: {
    gap: 8,
  },
  activeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  storeIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  activeCopy: {
    flex: 1,
    gap: 4,
  },
  activeName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#20263A",
  },
  activeMeta: {
    fontSize: 13,
    lineHeight: 19,
    color: "#7B6F69",
  },
  activeTotal: {
    fontSize: 15,
    fontWeight: "900",
    color: "#20263A",
  },
  activePillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  activeInfoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F4F0EB",
  },
  activeInfoPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24314A",
  },
  activeFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  activeFooterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7B6F69",
    flex: 1,
  },
  secondaryActiveList: {
    gap: 10,
  },
  secondaryActiveCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  secondaryActiveLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  secondaryActiveIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F0EB",
  },
  secondaryActiveCopy: {
    flex: 1,
    gap: 3,
  },
  secondaryActiveName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#20263A",
  },
  secondaryActiveMeta: {
    fontSize: 12,
    color: "#7B6F69",
  },
  filterRow: {
    gap: 10,
    paddingRight: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 10,
  },
  historyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1CC",
  },
  historyCopy: {
    flex: 1,
    gap: 4,
  },
  historyName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#20263A",
  },
  historyMeta: {
    fontSize: 13,
    color: "#7B6F69",
  },
  historyTotal: {
    fontSize: 14,
    fontWeight: "900",
    color: "#20263A",
  },
  historyItems: {
    fontSize: 13,
    lineHeight: 19,
    color: "#7B6F69",
  },
  historyBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  historyPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
  },
  historyPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F4F0EB",
  },
  historyPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#24314A",
  },
  historyPillOffer: {
    backgroundColor: "#FFE8F0",
  },
  historyPillOfferText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FF5D8F",
  },
  historyPillCancelled: {
    backgroundColor: "#FFE8E8",
  },
  historyPillCancelledText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#D64545",
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
    backgroundColor: "#DFF7E9",
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
    backgroundColor: "#2FBF71",
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
