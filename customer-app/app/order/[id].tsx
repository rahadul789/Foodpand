import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OrderDetailSkeleton } from "@/components/order-skeletons";
import type { Order } from "@/lib/customer-data";
import { useAuthStore } from "@/lib/auth-store";
import { useCartStore } from "@/lib/cart-store";
import {
  getResolvedOrder,
  isOrderCancelable,
} from "@/lib/order-store";
import {
  useCancelOrderMutation,
  useOrderDetailQuery,
} from "@/lib/order-queries";
import { useCustomerOrderRealtime } from "@/lib/order-realtime";
import { useRestaurantDetailQuery } from "@/lib/restaurant-queries";
import {
  formatTimeLabel,
  getDisplayOrderCode,
  getDynamicPrepareRange,
} from "@/lib/order-timing";
import { getLiveRouteMetrics } from "@/lib/route-metrics";
import { useUIStore } from "@/lib/ui-store";

function formatDateTime(value: string) {
  const date = new Date(value);

  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusAccent(status: Order["status"]) {
  if (status === "Delivered") {
    return {
      bg: "#E7F8EE",
      text: "#1F9D57",
      icon: "checkmark-circle-outline" as const,
    };
  }

  if (status === "On the way") {
    return {
      bg: "#E8EDFF",
      text: "#4B67E8",
      icon: "bicycle-outline" as const,
    };
  }

  if (status === "Ready for pickup") {
    return {
      bg: "#EAF7FF",
      text: "#267AA8",
      icon: "checkmark-circle-outline" as const,
    };
  }

  if (status === "Cancelled") {
    return {
      bg: "#FFE3E3",
      text: "#D64545",
      icon: "close-circle-outline" as const,
    };
  }

  return {
    bg: "#FFF1CC",
    text: "#9B6500",
    icon: "restaurant-outline" as const,
  };
}

function FloatingStatusOrb({
  icon,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
}) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [bob]);

  return (
    <Animated.View
      style={[
        styles.heroFloatingOrb,
        {
          transform: [
            {
              translateY: bob.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -8],
              }),
            },
          ],
        },
      ]}
    >
      <Ionicons name={icon} size={22} color={tint} />
    </Animated.View>
  );
}

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const replaceCartWithItems = useCartStore((state) => state.replaceCartWithItems);
  const showToast = useUIStore((state) => state.showToast);
  const cancelOrderMutation = useCancelOrderMutation();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [progressNow, setProgressNow] = useState(() => Date.now());

  useCustomerOrderRealtime(Boolean(user?.id));

  const {
    data: orderData,
    isLoading: orderLoading,
  } = useOrderDetailQuery(id, Boolean(user?.id));
  const order = useMemo(
    () => getResolvedOrder(orderData ?? null),
    [orderData],
  );
  const {
    data: restaurant,
    isLoading: restaurantLoading,
  } = useRestaurantDetailQuery(order?.restaurantId);
  const liveRouteMetrics = useMemo(
    () =>
      order
        ? getLiveRouteMetrics({
            riderLocation: order.deliveryLiveLocation ?? null,
            destination: order.deliveryLocation ?? null,
            speedMps: order.deliveryLiveLocation?.speed ?? null,
          })
        : null,
    [order],
  );

  useEffect(() => {
    if (order?.status !== "Preparing") {
      return undefined;
    }

    const timer = setInterval(() => {
      setProgressNow(Date.now());
    }, 60_000);

    return () => clearInterval(timer);
  }, [order?.status]);

  if (orderLoading || (order && restaurantLoading)) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar style="dark" backgroundColor="#FFF7F2" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <OrderDetailSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar style="dark" backgroundColor="#FFF7F2" />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Order not found</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusAccent = getStatusAccent(order.status);
  const cancelable = isOrderCancelable(order);
  const isPreviousOrder =
    order.status === "Delivered" || order.status === "Cancelled";
  const dynamicPrepareRange = getDynamicPrepareRange(order, progressNow);
  const heroImage = restaurant?.coverImage || order.restaurantCoverImage || "";

  const handleReorder = () => {
    if (!restaurant) {
      showToast("Restaurant information is unavailable right now.");
      return;
    }

    const entries = order.lineItems
      .map((lineItem, index) => {
        const menuItem = restaurant.menu.find((item) => item.id === lineItem.itemId);

        if (!menuItem) {
          return null;
        }

        return {
          item: menuItem,
          quantity: lineItem.quantity,
          unitTk: lineItem.unitTk,
          summary: lineItem.summary,
          cartKey: `${order.id}-${lineItem.itemId}-${index}`,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    if (entries.length === 0) {
      showToast("This order can not be reordered right now.");
      return;
    }

    const ok = replaceCartWithItems({
      restaurant,
      entries,
      redirectTo: "/cart",
    });

    if (ok) {
      showToast("Items added to cart");
      router.push("/cart");
    }
  };

  const handleConfirmCancel = async () => {
    try {
      const cancelledOrder = await cancelOrderMutation.mutateAsync(order.id);
      setShowCancelModal(false);
      showToast("Order cancelled before restaurant acceptance.");
      router.replace({
        pathname: "/order/[id]",
        params: { id: cancelledOrder.id },
      });
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to cancel the order right now.",
      );
    }
  };

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
          <Text style={styles.topTitle}>Order details</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroCard}>
          {heroImage ? (
            <Image
              source={{ uri: heroImage }}
              style={styles.heroImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.heroFallback]} />
          )}
          <View style={styles.heroOverlay} />
          <FloatingStatusOrb icon={statusAccent.icon} tint={statusAccent.text} />
          <View style={styles.heroContent}>
            <View style={[styles.statusPill, { backgroundColor: statusAccent.bg }]}>
              <Ionicons name={statusAccent.icon} size={14} color={statusAccent.text} />
              <Text style={[styles.statusPillText, { color: statusAccent.text }]}>
                {order.status}
              </Text>
            </View>
            <Text style={styles.heroTitle}>{order.restaurantName}</Text>
            <Text style={styles.heroMeta}>
              {getDisplayOrderCode(order)} | {formatDateTime(order.placedAt)}
            </Text>
            <Text style={styles.heroSubMeta}>
              {order.status === "On the way" && liveRouteMetrics
                ? `${liveRouteMetrics.distanceLabel} | ${liveRouteMetrics.etaLabel}`
                : order.eta}
            </Text>
          </View>
        </View>

        <View style={styles.highlightRow}>
          <View style={[styles.highlightCard, { backgroundColor: "#E8EDFF" }]}>
            <Ionicons name="cash-outline" size={18} color="#24314A" />
            <Text style={styles.highlightTitle}>Total paid</Text>
            <Text style={styles.highlightValue}>TK {order.total}</Text>
          </View>
          <View style={[styles.highlightCard, { backgroundColor: "#E7F8EE" }]}>
            <Ionicons name={statusAccent.icon} size={18} color="#24314A" />
            <Text style={styles.highlightTitle}>Current status</Text>
            <Text style={styles.highlightValueSmall}>{order.status}</Text>
          </View>
        </View>

        {dynamicPrepareRange ? (
          <View style={styles.prepareCard}>
            <View style={styles.prepareTopRow}>
              <View style={styles.prepareIcon}>
                <Ionicons
                  name={dynamicPrepareRange.delayed ? "time-outline" : "restaurant-outline"}
                  size={18}
                  color={dynamicPrepareRange.delayed ? "#9B6500" : "#24314A"}
                />
              </View>
              <View style={styles.prepareCopy}>
                <Text style={styles.prepareTitle}>
                  {dynamicPrepareRange.delayed
                    ? "Kitchen is taking a little longer"
                    : `Prepare time now ${dynamicPrepareRange.displayLabel}`}
                </Text>
                <Text style={styles.prepareText}>
                  {dynamicPrepareRange.delayed
                    ? "The restaurant is still preparing your order. We will refresh the next status as soon as it changes."
                    : `Started ${formatTimeLabel(order.restaurantAcceptedAt) ?? "just now"} - Estimated ready around ${
                        formatTimeLabel(order.estimatedReadyAt) ?? "soon"
                      }`}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.itemList}>
            {order.lineItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemQty}>
                  <Text style={styles.itemQtyText}>{item.quantity}</Text>
                </View>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.summary ? (
                    <Text style={styles.itemSummary}>{item.summary}</Text>
                  ) : null}
                </View>
                <Text style={styles.itemPrice}>TK {item.unitTk * item.quantity}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>TK {order.subtotalTk}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery fee</Text>
            <Text style={styles.billValue}>TK {order.deliveryTk}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Service fee</Text>
            <Text style={styles.billValue}>TK {order.serviceFeeTk}</Text>
          </View>
          {order.discountTk > 0 ? (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Discount</Text>
              <Text style={styles.billValue}>-TK {order.discountTk}</Text>
            </View>
          ) : null}
          <View style={[styles.billRow, styles.billStrongRow]}>
            <Text style={styles.billStrongLabel}>Total</Text>
            <Text style={styles.billStrongValue}>TK {order.total}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Delivery & payment</Text>
          <InfoRow
            icon="location-outline"
            label="Delivery address"
            value={order.deliveryAddress}
          />
          <InfoRow
            icon="card-outline"
            label="Payment method"
            value={order.paymentMethod}
          />
          {order.riderName ? (
            <InfoRow icon="bicycle-outline" label="Rider" value={order.riderName} />
          ) : null}
          {order.note ? (
            <InfoRow icon="chatbox-outline" label="Note" value={order.note} />
          ) : null}
        </View>

        <View style={styles.actionRow}>
          {order.canTrack ? (
            <Pressable
              style={[styles.secondaryButton, styles.secondaryButtonTrack]}
              onPress={() =>
                router.push({
                  pathname: "/tracking",
                  params: {
                    payment: order.paymentMethod === "bKash" ? "bkash" : "cod",
                    orderId: order.id,
                  },
                })
              }
            >
              <Ionicons name="navigate-outline" size={18} color="#24314A" />
              <Text style={styles.secondaryButtonText}>Track order</Text>
            </Pressable>
          ) : cancelable ? (
            <Pressable
              style={[styles.secondaryButton, styles.secondaryButtonDanger]}
              onPress={() => setShowCancelModal(true)}
            >
              <Ionicons name="close-circle-outline" size={18} color="#C83A3A" />
              <Text style={styles.secondaryButtonDangerText}>Cancel order</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push("/help-center")}
            >
              <Ionicons name="help-circle-outline" size={18} color="#24314A" />
              <Text style={styles.secondaryButtonText}>Need help</Text>
            </Pressable>
          )}
          {isPreviousOrder ? (
            <Pressable style={styles.primaryButton} onPress={handleReorder}>
              <Text style={styles.primaryButtonText}>Reorder</Text>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.policyCard}>
          <View style={styles.policyIcon}>
            <Ionicons
              name={cancelable ? "shield-checkmark-outline" : "restaurant-outline"}
              size={18}
              color="#24314A"
            />
          </View>
          <View style={styles.policyCopy}>
            <Text style={styles.policyTitle}>Cancellation policy</Text>
            <Text style={styles.policyText}>
              {cancelable
                ? "You can cancel this order now because the restaurant has not accepted it yet."
                : order.status === "Cancelled"
                  ? "This order was cancelled before the restaurant accepted it."
                  : "After restaurant acceptance, cancellation is locked to reduce kitchen misuse and food waste."}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={showCancelModal}
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowCancelModal(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalBadge}>
              <Ionicons name="alert-circle-outline" size={24} color="#C83A3A" />
            </View>
            <Text style={styles.modalTitle}>Cancel this order?</Text>
            <Text style={styles.modalText}>
              The restaurant has not accepted it yet, so you can cancel now. Once
              accepted, this action will be locked.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonGhost]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalButtonGhostText}>Keep order</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={() => void handleConfirmCancel()}
              >
                <Text style={styles.modalButtonDangerText}>Cancel now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color="#24314A" />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
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
    paddingBottom: 36,
    gap: 18,
  },
  topRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontSize: 18,
    fontWeight: "900",
    color: "#20263A",
  },
  placeholder: {
    width: 44,
  },
  heroCard: {
    height: 220,
    borderRadius: 30,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    backgroundColor: "#F1E7DE",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 23, 35, 0.34)",
  },
  heroFloatingOrb: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.84)",
  },
  heroContent: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    gap: 10,
  },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "900",
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  heroMeta: {
    fontSize: 13,
    color: "rgba(255,255,255,0.82)",
  },
  heroSubMeta: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  prepareCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#FFF6E9",
    gap: 10,
  },
  prepareTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  prepareIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  prepareCopy: {
    flex: 1,
    gap: 4,
  },
  prepareTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#20263A",
  },
  prepareText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6F6A77",
  },
  highlightRow: {
    flexDirection: "row",
    gap: 12,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    gap: 8,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#24314A",
  },
  highlightValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#20263A",
  },
  highlightValueSmall: {
    fontSize: 18,
    fontWeight: "900",
    color: "#20263A",
  },
  policyCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#FFF4E6",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  policyIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  policyCopy: {
    flex: 1,
    gap: 6,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#20263A",
  },
  policyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6F6A77",
  },
  sectionCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#FFFFFF",
    gap: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#20263A",
  },
  itemList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  itemQty: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1CC",
  },
  itemQtyText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#9B6500",
  },
  itemCopy: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#20263A",
  },
  itemSummary: {
    fontSize: 12,
    lineHeight: 18,
    color: "#7B6F69",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#20263A",
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  billLabel: {
    fontSize: 14,
    color: "#7B6F69",
  },
  billValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#20263A",
  },
  billStrongRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0D9D5",
  },
  billStrongLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#20263A",
  },
  billStrongValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#20263A",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  infoCopy: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8A7E75",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    color: "#20263A",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  secondaryButton: {
    flex: 1,
    minWidth: 148,
    minHeight: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F4F0EB",
  },
  secondaryButtonTrack: {
    backgroundColor: "#E7F8EE",
  },
  secondaryButtonDanger: {
    backgroundColor: "#FFE8E8",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#24314A",
  },
  secondaryButtonDangerText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#C83A3A",
  },
  primaryButton: {
    flex: 1,
    minWidth: 148,
    minHeight: 56,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FF5D8F",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#20263A",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(21, 18, 17, 0.38)",
  },
  modalCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: "#FFF7F2",
    gap: 14,
  },
  modalBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEAEA",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#20263A",
  },
  modalText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6F6A77",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonGhost: {
    backgroundColor: "#FFFFFF",
  },
  modalButtonDanger: {
    backgroundColor: "#FF6A6A",
  },
  modalButtonGhostText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#20263A",
  },
  modalButtonDangerText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
