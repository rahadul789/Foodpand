import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePreventRemove } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  Vibration,
  View,
} from "react-native";

import {
  AppScreen,
  FoodArtwork,
  MetricText,
  PrimaryButton,
  TextPill,
  theme,
} from "@/components/customer-ui";
import { useAuthStore } from "@/lib/auth-store";
import { getResolvedOrder } from "@/lib/order-store";
import { useCustomerOrderRealtime } from "@/lib/order-realtime";
import { formatTimeLabel, getDisplayOrderCode, getDynamicPrepareRange } from "@/lib/order-timing";
import {
  useActiveOrdersQuery,
  useOrderDetailQuery,
  useOrderHistoryQuery,
} from "@/lib/order-queries";

const confettiPalette = [
  "#FF5D8F",
  "#FFD166",
  "#5C7CFA",
  "#2FBF71",
  "#FF9F1C",
  "#7BDFF2",
];

const confettiSeeds = Array.from({ length: 28 }, (_, index) => ({
  id: `piece-${index}`,
  left: `${(index * 11) % 96}%` as `${number}%`,
  delay: index * 35,
  size: 8 + (index % 5) * 2,
  color: confettiPalette[index % confettiPalette.length],
  sway: (index % 2 === 0 ? 1 : -1) * (20 + (index % 6) * 4),
}));

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function OrderSuccessConfetti({ visible }: { visible: boolean }) {
  const { height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 2400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress, visible]);

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      {confettiSeeds.map((piece) => (
        <Animated.View
          key={piece.id}
          style={[
            styles.confettiPiece,
            {
              left: piece.left,
              width: piece.size,
              height: piece.size * 1.6,
              backgroundColor: piece.color,
              opacity: progress.interpolate({
                inputRange: [0, 0.12, 0.9, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-80 - piece.delay, height * 0.62],
                  }),
                },
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, piece.sway, piece.sway * 0.25],
                  }),
                },
                {
                  rotate: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", `${220 + piece.delay * 0.35}deg`],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function TrackingScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const params = useLocalSearchParams<{
    fresh?: string;
    locked?: string;
    payment?: string;
    orderId?: string;
  }>();
  const { data: activeOrders = [], isLoading: activeLoading } = useActiveOrdersQuery(Boolean(user?.id));
  const { data: previousOrders = [], isLoading: historyLoading } = useOrderHistoryQuery(Boolean(user?.id));
  const { data: detailOrder, isLoading: detailLoading } = useOrderDetailQuery(
    params.orderId,
    Boolean(user?.id && params.orderId),
  );
  const [allowLeave, setAllowLeave] = useState(false);
  const [progressNow, setProgressNow] = useState(() => Date.now());
  const prepProgressAnimation = useRef(new Animated.Value(0)).current;

  useCustomerOrderRealtime(Boolean(user?.id));

  const isFreshOrder = params.fresh === "1";
  const lockBackNavigation = params.locked === "1";
  const order = useMemo(() => {
    if (detailOrder) {
      return getResolvedOrder(detailOrder);
    }

    const pool = [...activeOrders, ...previousOrders];

    if (params.orderId) {
      return getResolvedOrder(
        pool.find((entry) => entry.id === params.orderId) ?? activeOrders[0] ?? null,
      );
    }

    return getResolvedOrder(activeOrders[0] ?? null);
  }, [activeOrders, detailOrder, params.orderId, previousOrders]);
  const paymentLabel = useMemo(() => {
    if (params.payment === "cod") {
      return "Cash on delivery";
    }

    return "Payment confirmed";
  }, [params.payment]);

  const prepProgress = useMemo(() => {
    if (!order || order.status !== "Preparing" || !order.restaurantAcceptedAt || !order.estimatedReadyAt) {
      return null;
    }

    const acceptedAtMs = new Date(order.restaurantAcceptedAt).getTime();
    const estimatedReadyAtMs = new Date(order.estimatedReadyAt).getTime();

    if (
      Number.isNaN(acceptedAtMs) ||
      Number.isNaN(estimatedReadyAtMs) ||
      estimatedReadyAtMs <= acceptedAtMs
    ) {
      return null;
    }

    const durationMs = estimatedReadyAtMs - acceptedAtMs;
    const elapsedMs = progressNow - acceptedAtMs;
    const remainingMs = estimatedReadyAtMs - progressNow;
    const progress = clamp(elapsedMs / durationMs);
    const dynamicRange = getDynamicPrepareRange(order, progressNow);

    return {
      progress,
      delayed: dynamicRange?.delayed ?? remainingMs < 0,
      remainingMinutes: dynamicRange?.remainingMinutes ?? Math.max(0, Math.ceil(remainingMs / 60000)),
      acceptedLabel: formatTimeLabel(order.restaurantAcceptedAt),
      readyLabel: formatTimeLabel(order.estimatedReadyAt),
      rangeLabel: dynamicRange?.displayLabel ?? "Preparing",
    };
  }, [
    order,
    progressNow,
  ]);

  usePreventRemove(lockBackNavigation && !allowLeave, () => {});

  const handleGoOrders = () => {
    setAllowLeave(true);
    router.replace("/(tabs)/orders");
  };

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    if (!isFreshOrder) {
      return;
    }

    Vibration.vibrate([0, 55, 30, 80, 40, 90]);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [isFreshOrder]);

  useEffect(() => {
    if (!prepProgress) {
      setProgressNow(Date.now());
      prepProgressAnimation.setValue(0);
      return undefined;
    }

    Animated.timing(prepProgressAnimation, {
      toValue: prepProgress.progress,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const timer = setInterval(() => {
      setProgressNow(Date.now());
    }, 60_000);

    return () => {
      clearInterval(timer);
    };
  }, [prepProgress, prepProgressAnimation]);

  if ((activeLoading || historyLoading || detailLoading) && !order) {
    return (
      <AppScreen scroll={false} contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.placeholder} />
          <Text style={styles.topLabel}>Order tracking</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>Loading your order...</Text>
          <Text style={styles.successText}>
            We are getting the latest order status for you.
          </Text>
        </View>
      </AppScreen>
    );
  }

  if (!order) {
    return (
      <AppScreen scroll={false} contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.placeholder} />
          <Text style={styles.topLabel}>Order tracking</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>No live order right now</Text>
          <Text style={styles.successText}>
            Once you place a fresh order, live updates will show up here.
          </Text>
          <PrimaryButton
            label="Go to orders"
            icon="receipt-outline"
            onPress={handleGoOrders}
          />
        </View>
      </AppScreen>
    );
  }

  const isPendingAcceptance = order.status === "Pending acceptance";
  const isPreparing = order.status === "Preparing";
  const isReadyForPickup = order.status === "Ready for pickup";
  const isOnTheWay = order.status === "On the way";
  const isDelivered = order.status === "Delivered";
  const riderAccepted = isReadyForPickup && Boolean(order.riderName);
  const stageIcon = isPendingAcceptance
    ? "time-outline"
    : isPreparing
      ? "restaurant-outline"
      : isReadyForPickup
        ? "checkmark-circle-outline"
      : isDelivered
        ? "checkmark-done-outline"
        : "bicycle";
  const stageMessage = isPendingAcceptance
    ? `The restaurant is reviewing ${order.items.join(", ")}. Cancellation stays open until acceptance.`
    : isPreparing
      ? `${order.restaurantName} is preparing ${order.items.join(", ")}. Delivery updates will appear after dispatch.`
      : isReadyForPickup
        ? riderAccepted
          ? `${order.riderName} accepted your order and will pick it up shortly from ${order.restaurantName}.`
          : `${order.restaurantName} has finished preparing your order. A delivery partner will accept it soon.`
        : isDelivered
        ? `${order.items.join(", ")} was delivered successfully.`
        : `Your courier is on the way with ${order.items.join(", ")}.`;
  const prepHeadline = prepProgress?.delayed
    ? "Kitchen is taking a little longer than expected"
    : prepProgress?.remainingMinutes
      ? `${prepProgress.remainingMinutes} min left in the kitchen`
      : "Almost ready for rider pickup";
  const prepSubtext = prepProgress
    ? prepProgress.delayed
      ? "The restaurant is still preparing your order. We will update you as soon as it is ready."
      : `Estimated prepare time ${prepProgress.rangeLabel}${
          prepProgress.readyLabel ? ` - Ready around ${prepProgress.readyLabel}` : ""
        }`
    : null;

  return (
    <AppScreen scroll={false} contentContainerStyle={styles.container}>
      <OrderSuccessConfetti visible={isFreshOrder} />

      <View style={styles.topRow}>
        {lockBackNavigation ? (
          <View style={styles.placeholder} />
        ) : (
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.colors.text}
            onPress={handleBack}
          />
        )}
        <Text style={styles.topLabel}>Order tracking</Text>
        <View style={styles.placeholder} />
      </View>

      {isFreshOrder ? (
        <View style={styles.successCard}>
          <TextPill
            label="Order placed successfully"
            icon="sparkles-outline"
            accent="#E7F8EE"
            textColor={theme.colors.success}
          />
          <Text style={styles.successTitle}>Yay, your order is confirmed</Text>
          <Text style={styles.successText}>
            The restaurant will review your order first. You can cancel before it
            gets accepted.
          </Text>
        </View>
      ) : null}

      <View style={styles.mapCard}>
        <View style={styles.mapPattern}>
          <View style={styles.routeLine} />
          <View style={[styles.pin, styles.pinStart]} />
          <View style={[styles.pin, styles.pinEnd]} />
          <View style={styles.riderBadge}>
            <FoodArtwork
              accent={order.accent}
              icon={stageIcon}
              size={78}
            />
          </View>
          {isOnTheWay ? (
            <View style={styles.liveMapHint}>
              <Ionicons name="navigate-outline" size={14} color="#24314A" />
              <Text style={styles.liveMapHintText}>
                Live rider map will appear here when delivery location is connected.
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetTopRow}>
          <TextPill label={order.status} icon="radio-button-on-outline" />
          <TextPill
            label={paymentLabel}
            icon={params.payment === "cod" ? "cash-outline" : "card-outline"}
            accent={params.payment === "cod" ? "#E7F8EE" : "#E8EDFF"}
            textColor="#24314A"
          />
        </View>
        <MetricText>{order.eta}</MetricText>
        <Text style={styles.orderCodeText}>{getDisplayOrderCode(order)}</Text>
        <Text style={styles.orderText}>{stageMessage}</Text>

        {prepProgress ? (
          <View style={styles.prepCard}>
            <View style={styles.prepHeader}>
              <View style={styles.prepIconWrap}>
                <Ionicons
                  name={prepProgress.delayed ? "time-outline" : "restaurant-outline"}
                  size={18}
                  color={prepProgress.delayed ? "#9B5D00" : theme.colors.primary}
                />
              </View>
              <View style={styles.prepCopy}>
                <Text style={styles.prepTitle}>{prepHeadline}</Text>
                <Text style={styles.prepSubtitle}>{prepSubtext}</Text>
              </View>
            </View>
            <View style={styles.prepProgressTrack}>
              <Animated.View
                style={[
                  styles.prepProgressFill,
                  prepProgress.delayed ? styles.prepProgressFillDelayed : null,
                  {
                    width: prepProgressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
            <View style={styles.prepMetaRow}>
              <Text style={styles.prepMetaText}>
                Started {prepProgress.acceptedLabel ?? "just now"}
              </Text>
              <Text style={styles.prepMetaText}>
                {prepProgress.delayed
                  ? "We are watching for the next update"
                  : `Now showing ${prepProgress.rangeLabel}`}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.timeline}>
          <View style={styles.timelineRow}>
            <View style={[styles.timelineDot, styles.timelineDotDone]} />
            <Text style={styles.timelineText}>Order placed</Text>
          </View>
          <View style={styles.timelineRow}>
            <View
              style={[
                styles.timelineDot,
                isPendingAcceptance
                  ? styles.timelineDotLive
                  : isPreparing || isReadyForPickup || isOnTheWay || isDelivered
                    ? styles.timelineDotDone
                    : styles.timelineDotIdle,
              ]}
            />
            <Text style={styles.timelineText}>Restaurant accepts</Text>
          </View>
          <View style={styles.timelineRow}>
            <View
              style={[
                styles.timelineDot,
                isPreparing
                  ? styles.timelineDotLive
                  : isReadyForPickup || isOnTheWay || isDelivered
                    ? styles.timelineDotDone
                    : styles.timelineDotIdle,
              ]}
            />
            <Text style={styles.timelineText}>Preparing your food</Text>
          </View>
          <View style={styles.timelineRow}>
            <View
              style={[
                styles.timelineDot,
                isReadyForPickup
                  ? styles.timelineDotLive
                  : isOnTheWay || isDelivered
                    ? styles.timelineDotDone
                    : styles.timelineDotIdle,
              ]}
            />
            <Text style={styles.timelineText}>Ready for pickup</Text>
          </View>
          <View style={styles.timelineRow}>
            <View
              style={[
                styles.timelineDot,
                isOnTheWay
                  ? styles.timelineDotLive
                  : isDelivered
                    ? styles.timelineDotDone
                    : styles.timelineDotIdle,
              ]}
            />
            <Text style={styles.timelineText}>Courier on the way</Text>
          </View>
        </View>

        <PrimaryButton
          label={lockBackNavigation ? "Go to orders" : "Back to orders"}
          icon="receipt-outline"
          onPress={handleGoOrders}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 18,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    zIndex: 20,
  },
  confettiPiece: {
    position: "absolute",
    top: 0,
    borderRadius: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  placeholder: {
    width: 24,
  },
  successCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "#D7EEDF",
  },
  successTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: theme.colors.text,
  },
  successText: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.muted,
  },
  mapCard: {
    flex: 1,
    borderRadius: theme.radius.xl,
    backgroundColor: "#EBDCCB",
    overflow: "hidden",
    position: "relative",
  },
  mapPattern: {
    flex: 1,
    backgroundColor: "#F0E2D3",
    position: "relative",
  },
  routeLine: {
    position: "absolute",
    top: "18%",
    left: "22%",
    right: "25%",
    bottom: "24%",
    borderWidth: 4,
    borderColor: theme.colors.primary,
    borderStyle: "dashed",
    borderRadius: 40,
  },
  pin: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.text,
  },
  pinStart: {
    left: "20%",
    top: "18%",
  },
  pinEnd: {
    right: "23%",
    bottom: "24%",
  },
  riderBadge: {
    position: "absolute",
    top: "38%",
    left: "40%",
  },
  liveMapHint: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.84)",
  },
  liveMapHintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#24314A",
  },
  bottomSheet: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  sheetTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  orderText: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.muted,
  },
  orderCodeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8A7E75",
    marginTop: -6,
  },
  prepCard: {
    gap: 12,
    padding: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: "#FFF6E9",
    borderWidth: 1,
    borderColor: "#F4D8A7",
  },
  prepHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  prepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  prepCopy: {
    flex: 1,
    gap: 4,
  },
  prepTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.colors.text,
  },
  prepSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.muted,
  },
  prepProgressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#F2E2C6",
  },
  prepProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  prepProgressFillDelayed: {
    backgroundColor: "#D49B24",
  },
  prepMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  prepMetaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B6C47",
  },
  timeline: {
    gap: 12,
    paddingTop: 6,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineDotDone: {
    backgroundColor: theme.colors.success,
  },
  timelineDotLive: {
    backgroundColor: theme.colors.primary,
  },
  timelineDotIdle: {
    backgroundColor: "#D8CFC4",
  },
  timelineText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
});
