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
import { getResolvedOrder, useOrderStore } from "@/lib/order-store";

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
  const params = useLocalSearchParams<{
    fresh?: string;
    locked?: string;
    payment?: string;
    orderId?: string;
  }>();
  const activeOrders = useOrderStore((state) => state.activeOrders);
  const previousOrders = useOrderStore((state) => state.previousOrders);
  const [allowLeave, setAllowLeave] = useState(false);

  const isFreshOrder = params.fresh === "1";
  const lockBackNavigation = params.locked === "1";
  const order = useMemo(() => {
    const pool = [...activeOrders, ...previousOrders];

    if (params.orderId) {
      return getResolvedOrder(
        pool.find((entry) => entry.id === params.orderId) ?? activeOrders[0] ?? null,
      );
    }

    return getResolvedOrder(activeOrders[0] ?? null);
  }, [activeOrders, params.orderId, previousOrders]);
  const paymentLabel = useMemo(() => {
    if (params.payment === "cod") {
      return "Cash on delivery";
    }

    return "Payment confirmed";
  }, [params.payment]);

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
  const isOnTheWay = order.status === "On the way";
  const isDelivered = order.status === "Delivered";
  const stageIcon = isPendingAcceptance
    ? "time-outline"
    : isPreparing
      ? "restaurant-outline"
      : isDelivered
        ? "checkmark-done-outline"
        : "bicycle";
  const stageMessage = isPendingAcceptance
    ? `The restaurant is reviewing ${order.items.join(", ")}. Cancellation stays open until acceptance.`
    : isPreparing
      ? `${order.restaurantName} is preparing ${order.items.join(", ")}. Delivery updates will appear after dispatch.`
      : isDelivered
        ? `${order.items.join(", ")} was delivered successfully.`
        : `Your courier is on the way with ${order.items.join(", ")}.`;

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
        <Text style={styles.orderText}>{stageMessage}</Text>

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
                  : isPreparing || isOnTheWay || isDelivered
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
