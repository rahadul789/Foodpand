import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/lib/auth-store";
import { updateRiderAvailability } from "@/lib/delivery-presence";
import { useDeliveryLiveLocation } from "@/lib/live-location";
import type { DeliveryOrder } from "@/lib/order-api";
import { removeDeliveryPushTokenFromBackend } from "@/lib/push-notifications";
import { getLiveRouteMetrics } from "@/lib/route-metrics";
import {
  useAcceptDeliveryMutation,
  useAssignedDeliveryOrdersQuery,
  useAvailableDeliveryOrdersQuery,
  useDeliveryOrderStatusMutation,
} from "@/lib/order-queries";

const EMPTY_ORDERS: DeliveryOrder[] = [];
const PUSH_TOKEN_KEY = "delivery-app-push-token";
type DeliveryTab = "home" | "active" | "profile";
function RiderPin({ heading = 0 }: { heading?: number }) {
  return (
    <View style={styles.mapMarkerWrap}>
      <View style={styles.riderPinOuter}>
        <View
          style={{
            transform: [{ rotate: `${heading}deg` }],
          }}
        >
          <Ionicons name="navigate" size={16} color="#FFFFFF" />
        </View>
      </View>
      <View style={styles.mapPointerDark} />
    </View>
  );
}

function CustomerPin({ pulse }: { pulse: Animated.Value }) {
  return (
    <View style={styles.mapMarkerWrap}>
      <Animated.View
        style={[
          styles.customerGlow,
          {
            transform: [{ scale: pulse }],
            opacity: pulse.interpolate({
              inputRange: [1, 1.45],
              outputRange: [0.26, 0],
            }),
          },
        ]}
      />
      <View style={styles.customerPinOuter}>
        <View style={styles.customerPinInner}>
          <Ionicons name="home-outline" size={13} color="#FF5D8F" />
        </View>
      </View>
      <View style={styles.mapPointerSoft} />
    </View>
  );
}

function formatPlacedAt(value?: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getDispatchLabel(order: DeliveryOrder, now: number) {
  if (order.deliveryDispatchWindowExpiresAt) {
    const secondsLeft = Math.max(
      0,
      Math.ceil(
        (new Date(order.deliveryDispatchWindowExpiresAt).getTime() - now) / 1000,
      ),
    );

    if (secondsLeft > 0) {
      return `Round ${order.deliveryDispatchRound || 1} · ${secondsLeft}s left`;
    }
  }

  if (order.deliveryDispatchExhaustedAt) {
    return "Fallback pool";
  }

  return undefined;
}

function LoginCard() {
  const login = useAuthStore((state) => state.login);
  const isAuthenticating = useAuthStore((state) => state.isAuthenticating);
  const authError = useAuthStore((state) => state.authError);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login({
        email: email.trim(),
        password,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={styles.authCard}>
      <Text style={styles.eyebrow}>DELIVERY PARTNER</Text>
      <Text style={styles.authTitle}>Bela Rider Hub</Text>
      <Text style={styles.authSubtitle}>
        Log in, accept available deliveries, manage assigned orders, and run one live route safely.
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#9AA7B4"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#9AA7B4"
        secureTextEntry
        style={styles.input}
      />

      {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

      <Pressable
        onPress={() => {
          void handleLogin();
        }}
        disabled={isAuthenticating}
        style={[styles.primaryButton, isAuthenticating ? styles.buttonDisabled : null]}
      >
        {isAuthenticating ? (
          <ActivityIndicator color="#FFF9F4" />
        ) : (
          <Text style={styles.primaryButtonText}>Login as rider</Text>
        )}
      </Pressable>
    </View>
  );
}

function StatChip({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.statChip, accent ? styles.statChipAccent : null]}>
      <Text style={[styles.statLabel, accent ? styles.statLabelAccent : null]}>{label}</Text>
      <Text style={[styles.statValue, accent ? styles.statValueAccent : null]}>{value}</Text>
    </View>
  );
}

function DeliveryTabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, active ? styles.tabButtonActive : null]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={active ? "#FFF8F1" : "#7B8794"}
      />
      <Text style={[styles.tabButtonText, active ? styles.tabButtonTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function OrdersSkeleton({ title }: { title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {[0, 1].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonLineShort} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLineMuted} />
        </View>
      ))}
    </View>
  );
}

function DeliveryOrderCard({
  order,
  actionLabel,
  onAction,
  actionDisabled,
  footer,
  accent = "neutral",
}: {
  order: DeliveryOrder;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  footer?: string;
  accent?: "neutral" | "live";
}) {
  return (
    <View style={[styles.orderCard, accent === "live" ? styles.liveOrderCard : null]}>
      <View style={styles.orderCardTop}>
        <View style={styles.orderMetaColumn}>
          <Text style={styles.orderCode}>{order.orderCode || order.id}</Text>
          <Text style={styles.orderRestaurant}>{order.restaurantName}</Text>
          <Text style={styles.orderAddress}>{order.deliveryAddress}</Text>
        </View>
        <View style={[styles.statusBadge, accent === "live" ? styles.statusBadgeLive : null]}>
          <Text style={[styles.statusBadgeText, accent === "live" ? styles.statusBadgeTextLive : null]}>
            {order.status}
          </Text>
        </View>
      </View>

      <View style={styles.orderMetaRow}>
        <Text style={styles.metaText}>{formatPlacedAt(order.placedAt)}</Text>
        <Text style={styles.metaDot}>|</Text>
        <Text style={styles.metaText}>TK {order.total}</Text>
        <Text style={styles.metaDot}>|</Text>
        <Text style={styles.metaText}>{order.eta}</Text>
      </View>

      {footer ? <Text style={styles.footerText}>{footer}</Text> : null}

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          disabled={actionDisabled}
          style={[styles.secondaryButton, actionDisabled ? styles.buttonDisabled : null]}
        >
          <Text style={styles.secondaryButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function DeliveryHomeScreen() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => Boolean(state.user?.id && state.accessToken));

  const availableOrdersQuery = useAvailableDeliveryOrdersQuery(isAuthenticated);
  const assignedOrdersQuery = useAssignedDeliveryOrdersQuery(isAuthenticated);
  const acceptDeliveryMutation = useAcceptDeliveryMutation();
  const updateStatusMutation = useDeliveryOrderStatusMutation();
  const customerPulse = useRef(new Animated.Value(1)).current;
  const [activeTab, setActiveTab] = useState<DeliveryTab>("home");
  const [presencePending, setPresencePending] = useState(false);
  const [dispatchNow, setDispatchNow] = useState(() => Date.now());

  const availableOrders = availableOrdersQuery.data ?? EMPTY_ORDERS;
  const assignedOrders = assignedOrdersQuery.data ?? EMPTY_ORDERS;
  const liveOrder = useMemo(
    () => assignedOrders.find((order) => order.status === "On the way") ?? null,
    [assignedOrders],
  );
  const liveLocation = useDeliveryLiveLocation({
    enabled: Boolean(isAuthenticated && token && liveOrder?.id),
    orderId: liveOrder?.id ?? null,
    token,
  });
  const liveRouteMetrics = useMemo(
    () =>
      getLiveRouteMetrics({
        riderLocation:
          liveLocation.currentLocation ??
          liveOrder?.deliveryLiveLocation ??
          null,
        destination: liveOrder?.deliveryLocation ?? null,
        speedMps:
          liveLocation.currentLocation?.speed ??
          liveOrder?.deliveryLiveLocation?.speed ??
          null,
        transportMode: liveOrder?.deliveryTransportMode ?? "bicycle",
      }),
    [liveLocation.currentLocation, liveOrder],
  );
  const liveMapRegion = useMemo(() => {
    const riderLocation =
      liveLocation.currentLocation ?? liveOrder?.deliveryLiveLocation ?? null;
    const destination = liveOrder?.deliveryLocation ?? null;

    if (riderLocation && destination) {
      return {
        latitude: (riderLocation.latitude + destination.latitude) / 2,
        longitude: (riderLocation.longitude + destination.longitude) / 2,
        latitudeDelta: Math.max(
          0.004,
          Math.abs(riderLocation.latitude - destination.latitude) * 1.35,
        ),
        longitudeDelta: Math.max(
          0.004,
          Math.abs(riderLocation.longitude - destination.longitude) * 1.35,
        ),
      };
    }

    if (riderLocation) {
      return {
        latitude: riderLocation.latitude,
        longitude: riderLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }

    if (destination) {
      return {
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }

    return null;
  }, [liveLocation.currentLocation, liveOrder]);

  const riderName = user?.name?.split(" ")[0] || "Rider";
  const riderIsOnline = user?.deliveryAvailability?.isOnline !== false;
  const acceptsNewOrders = user?.deliveryAvailability?.acceptsNewOrders !== false;
  const isRefreshing =
    availableOrdersQuery.isRefetching || assignedOrdersQuery.isRefetching;

  const refreshAll = async () => {
    await Promise.all([availableOrdersQuery.refetch(), assignedOrdersQuery.refetch()]);
  };

  useEffect(() => {
    if (!liveOrder) {
      customerPulse.setValue(1);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(customerPulse, {
          toValue: 1.45,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(customerPulse, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [customerPulse, liveOrder]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDispatchNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleToggleOnline = async () => {
    if (!token || !user) {
      return;
    }

    setPresencePending(true);
    try {
      const nextUser = await updateRiderAvailability(token, {
        isOnline: !riderIsOnline,
        acceptsNewOrders,
        deliveryTransportMode: user.deliveryTransportMode ?? "bicycle",
      });
      setUser(nextUser);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setPresencePending(false);
    }
  };

  const handleToggleAccepting = async () => {
    if (!token || !user) {
      return;
    }

    setPresencePending(true);
    try {
      const nextUser = await updateRiderAvailability(token, {
        isOnline: riderIsOnline,
        acceptsNewOrders: !acceptsNewOrders,
        deliveryTransportMode: user.deliveryTransportMode ?? "bicycle",
      });
      setUser(nextUser);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setPresencePending(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        const savedPushToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
        await updateRiderAvailability(token, {
          isOnline: false,
          acceptsNewOrders: false,
          deliveryTransportMode: user?.deliveryTransportMode ?? "bicycle",
        });
        await removeDeliveryPushTokenFromBackend(token, savedPushToken);
        if (savedPushToken) {
          await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
        }
      } catch {
        // Cleanup should not block logout.
      }
    }

    logout();
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.authContainer}>
          <LoginCard />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshAll()} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>DELIVERY PANEL</Text>
            <Text style={styles.title}>Hi {riderName}, ready to move?</Text>
            <Text style={styles.subtitle}>
              {activeTab === "home"
                ? "Nearby selected delivery partners receive push first. You can still accept multiple orders, but only one picked-up route can go live at a time."
                : activeTab === "active"
                  ? "Track your live route here, then finish delivery before starting the next active map share."
                  : "Control whether dispatch should include you in targeted pickup notifications."}
            </Text>
          </View>

          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>
              {riderIsOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatChip label="Online" value={riderIsOnline ? "Yes" : "No"} />
          <StatChip label="Available" value={String(availableOrders.length)} />
          <StatChip
            label="Live route"
            value={liveOrder ? liveOrder.orderCode || liveOrder.id : "None"}
            accent
          />
        </View>

        {activeTab === "home" ? (
          <>
            {!riderIsOnline ? (
              <View style={styles.infoPanel}>
                <Text style={styles.infoPanelTitle}>You are offline</Text>
                <Text style={styles.infoPanelText}>
                  Turn online on from the Profile tab so the dispatch system can include you in nearby pickup alerts.
                </Text>
              </View>
            ) : null}
            {availableOrdersQuery.isLoading ? (
              <OrdersSkeleton title="Available orders" />
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available orders</Text>
                {availableOrders.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No open delivery task</Text>
                    <Text style={styles.emptyText}>
                      New delivery tasks will appear here when restaurants mark orders ready.
                    </Text>
                  </View>
                ) : (
                  availableOrders.map((order) => (
                    <DeliveryOrderCard
                      key={order.id}
                      order={order}
                      actionLabel="Accept delivery"
                      actionDisabled={acceptDeliveryMutation.isPending || !riderIsOnline || !acceptsNewOrders}
                      footer={
                        getDispatchLabel(order, dispatchNow)
                          ? `${getDispatchLabel(order, dispatchNow)}. Accepting moves this task into your assigned queue.`
                          : "Nearby selected riders receive the push first. Accepting moves this task into your assigned queue."
                      }
                      onAction={() => {
                        void acceptDeliveryMutation.mutateAsync(order.id);
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    />
                  ))
                )}
              </View>
            )}
            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelTitle}>Assigned summary</Text>
              <Text style={styles.infoPanelText}>
                You currently have {assignedOrders.length} assigned order{assignedOrders.length === 1 ? "" : "s"}.
                Use the Active tab for pickup start and live customer tracking.
              </Text>
            </View>
          </>
        ) : null}

        {activeTab === "active" ? (
          <>
            {liveOrder ? (
              <View style={styles.livePanel}>
                <Text style={styles.livePanelTitle}>Live route is active</Text>
                <Text style={styles.livePanelSubtitle}>
                  {liveOrder.orderCode || liveOrder.id} | {liveLocation.statusText}
                </Text>
                {liveMapRegion ? (
                  <View style={styles.liveMapWrap}>
                    <MapView
                      style={styles.liveMap}
                      region={liveMapRegion}
                      scrollEnabled={false}
                      rotateEnabled={false}
                      pitchEnabled={false}
                      zoomEnabled={false}
                      toolbarEnabled={false}
                    >
                      {liveOrder.deliveryLocation ? (
                        <Marker
                          coordinate={{
                            latitude: liveOrder.deliveryLocation.latitude,
                            longitude: liveOrder.deliveryLocation.longitude,
                          }}
                          anchor={{ x: 0.5, y: 0.88 }}
                          tracksViewChanges
                        >
                          <CustomerPin pulse={customerPulse} />
                        </Marker>
                      ) : null}
                      {liveLocation.currentLocation || liveOrder.deliveryLiveLocation ? (
                        <Marker
                          coordinate={{
                            latitude:
                              liveLocation.currentLocation?.latitude ??
                              (liveOrder.deliveryLiveLocation?.latitude as number),
                            longitude:
                              liveLocation.currentLocation?.longitude ??
                              (liveOrder.deliveryLiveLocation?.longitude as number),
                          }}
                          anchor={{ x: 0.5, y: 0.88 }}
                          tracksViewChanges
                        >
                          <RiderPin
                            heading={
                              liveLocation.currentLocation?.heading ??
                              liveOrder.deliveryLiveLocation?.heading ??
                              0
                            }
                          />
                        </Marker>
                      ) : null}
                      {liveOrder.deliveryLocation &&
                      (liveLocation.currentLocation || liveOrder.deliveryLiveLocation) ? (
                        <Polyline
                          coordinates={[
                            {
                              latitude:
                                liveLocation.currentLocation?.latitude ??
                                (liveOrder.deliveryLiveLocation?.latitude as number),
                              longitude:
                                liveLocation.currentLocation?.longitude ??
                                (liveOrder.deliveryLiveLocation?.longitude as number),
                            },
                            {
                              latitude: liveOrder.deliveryLocation.latitude,
                              longitude: liveOrder.deliveryLocation.longitude,
                            },
                          ]}
                          strokeColor="#E8792A"
                          strokeWidth={4}
                          lineDashPattern={[8, 8]}
                        />
                      ) : null}
                    </MapView>
                  </View>
                ) : null}
                {liveRouteMetrics ? (
                  <View style={styles.liveMapBadge}>
                    <View style={styles.liveMapBadgeIcon}>
                      <Ionicons name="time-outline" size={15} color="#243040" />
                    </View>
                    <View style={styles.liveMapBadgeCopy}>
                      <Text style={styles.liveMapBadgeTitle}>{liveRouteMetrics.etaLabel}</Text>
                      <Text style={styles.liveMapBadgeText}>
                        {liveRouteMetrics.distanceLabel} to customer
                      </Text>
                    </View>
                  </View>
                ) : null}
                <View style={styles.liveMeterTrack}>
                  <View style={styles.liveMeterFill} />
                </View>
                <Text style={styles.liveHint}>
                  {liveRouteMetrics
                    ? `${liveRouteMetrics.distanceLabel} left | ${liveRouteMetrics.etaLabel}. This customer is receiving your live route.`
                    : "This order is sharing live location with the customer. Mark it delivered before starting the next live route."}
                </Text>
              </View>
            ) : (
              <View style={styles.infoPanel}>
                <Text style={styles.infoPanelTitle}>No live route yet</Text>
                <Text style={styles.infoPanelText}>
                  Start a ready-for-pickup order and live location sharing will begin automatically.
                </Text>
              </View>
            )}

            {assignedOrdersQuery.isLoading ? (
              <OrdersSkeleton title="Assigned orders" />
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assigned orders</Text>
                {assignedOrders.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No assigned order yet</Text>
                    <Text style={styles.emptyText}>
                      Accept an order from the Home tab and it will appear here.
                    </Text>
                  </View>
                ) : (
                  assignedOrders.map((order) => {
                    const isLive = order.status === "On the way";
                    const actionLabel = isLive
                      ? "Mark delivered"
                      : order.status === "Ready for pickup"
                        ? "Start route"
                        : undefined;
                    const actionDisabled =
                      updateStatusMutation.isPending ||
                      (order.status === "Ready for pickup" && Boolean(liveOrder));
                    const footer = isLive
                      ? "Live location is being shared for this order."
                      : order.status === "Ready for pickup" && liveOrder
                        ? "Finish current live route before starting another pickup."
                        : "Accepted by you. Start route after pickup.";

                    return (
                      <DeliveryOrderCard
                        key={order.id}
                        order={order}
                        accent={isLive ? "live" : "neutral"}
                        actionLabel={actionLabel}
                        actionDisabled={actionDisabled}
                        footer={footer}
                        onAction={() => {
                          if (isLive) {
                            void updateStatusMutation.mutateAsync({
                              orderId: order.id,
                              payload: { status: "Delivered" },
                            });
                            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            return;
                          }

                          if (order.status === "Ready for pickup") {
                            void updateStatusMutation.mutateAsync({
                              orderId: order.id,
                              payload: { status: "On the way" },
                            });
                            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          }
                        }}
                      />
                    );
                  })
                )}
              </View>
            )}
          </>
        ) : null}

        {activeTab === "profile" ? (
          <>
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {user?.name?.slice(0, 1)?.toUpperCase() || "R"}
                </Text>
              </View>
              <View style={styles.profileCopy}>
                <Text style={styles.profileName}>{user?.name}</Text>
                <Text style={styles.profileMeta}>{user?.email}</Text>
                <Text style={styles.profileMeta}>
                  Mode: {user?.deliveryTransportMode || "bicycle"}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Availability</Text>
              <View style={styles.profileActionCard}>
                <View style={styles.profileActionCopy}>
                  <Text style={styles.profileActionTitle}>Rider online</Text>
                  <Text style={styles.profileActionText}>
                    Nearby targeted delivery notifications will only go to riders who are online.
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.profileActionButton,
                    riderIsOnline ? styles.profileActionButtonActive : null,
                    presencePending ? styles.buttonDisabled : null,
                  ]}
                  disabled={presencePending}
                  onPress={() => {
                    void handleToggleOnline();
                  }}
                >
                  <Text
                    style={[
                      styles.profileActionButtonText,
                      riderIsOnline ? styles.profileActionButtonTextActive : null,
                    ]}
                  >
                    {riderIsOnline ? "Online" : "Offline"}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.profileActionCard}>
                <View style={styles.profileActionCopy}>
                  <Text style={styles.profileActionTitle}>Accept new orders</Text>
                  <Text style={styles.profileActionText}>
                    Keep this on if you want the dispatch system to include you in pickup offers.
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.profileActionButton,
                    acceptsNewOrders ? styles.profileActionButtonActive : null,
                    presencePending ? styles.buttonDisabled : null,
                  ]}
                  disabled={presencePending}
                  onPress={() => {
                    void handleToggleAccepting();
                  }}
                >
                  <Text
                    style={[
                      styles.profileActionButtonText,
                      acceptsNewOrders ? styles.profileActionButtonTextActive : null,
                    ]}
                  >
                    {acceptsNewOrders ? "Accepting" : "Paused"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelTitle}>How delivery notifications work</Text>
              <Text style={styles.infoPanelText}>
                The backend now notifies a small nearby batch of online riders instead of sending every order to everyone at once.
              </Text>
            </View>

            <Pressable style={styles.ghostButton} onPress={() => void handleLogout()}>
              <Text style={styles.ghostButtonText}>Logout</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
      <View style={styles.bottomTabBar}>
        <DeliveryTabButton
          label="Home"
          icon="home-outline"
          active={activeTab === "home"}
          onPress={() => setActiveTab("home")}
        />
        <DeliveryTabButton
          label="Active"
          icon="bicycle-outline"
          active={activeTab === "active"}
          onPress={() => setActiveTab("active")}
        />
        <DeliveryTabButton
          label="Profile"
          icon="person-outline"
          active={activeTab === "profile"}
          onPress={() => setActiveTab("profile")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  authContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  authCard: {
    backgroundColor: "#FFFDFC",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F0D9C7",
    gap: 14,
    shadowColor: "#D18A42",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#D36F2A",
  },
  authTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
  },
  authSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#627182",
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E9D3C2",
    backgroundColor: "#FFF8F2",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1F2937",
  },
  errorText: {
    fontSize: 14,
    color: "#C2410C",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#1F2937",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFF9F4",
    fontSize: 15,
    fontWeight: "800",
  },
  container: {
    padding: 20,
    gap: 18,
    paddingBottom: 36,
  },
  header: {
    gap: 14,
  },
  headerPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFF2E4",
    borderWidth: 1,
    borderColor: "#F0D7BF",
  },
  headerPillText: {
    color: "#A3501B",
    fontWeight: "700",
  },
  title: {
    marginTop: 4,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: "#1F2937",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#627182",
    maxWidth: "94%",
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
  },
  bottomTabBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "rgba(255,248,240,0.98)",
    borderTopWidth: 1,
    borderTopColor: "#EEDFD2",
  },
  tabButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 18,
    backgroundColor: "#FFFDFC",
    borderWidth: 1,
    borderColor: "#EEDFD2",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: "#1F2937",
    borderColor: "#1F2937",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#7B8794",
  },
  tabButtonTextActive: {
    color: "#FFF8F1",
  },
  ghostButton: {
    alignSelf: "flex-start",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFF2E4",
    borderWidth: 1,
    borderColor: "#F0D7BF",
  },
  ghostButtonText: {
    color: "#A3501B",
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statChip: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#FFFDFC",
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1DCCB",
    gap: 6,
  },
  statChipAccent: {
    backgroundColor: "#1F2937",
    borderColor: "#1F2937",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B98A6",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statLabelAccent: {
    color: "#C8D0D9",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#243040",
  },
  statValueAccent: {
    color: "#FFF8F1",
  },
  livePanel: {
    borderRadius: 24,
    backgroundColor: "#FFF3DF",
    borderWidth: 1,
    borderColor: "#F1D3A7",
    padding: 18,
    gap: 10,
  },
  livePanelTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#8F3D0F",
  },
  livePanelSubtitle: {
    fontSize: 14,
    color: "#AA5A26",
    fontWeight: "600",
  },
  liveMapWrap: {
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F4D4AD",
  },
  liveMap: {
    flex: 1,
  },
  liveMapBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  liveMapBadgeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1CC",
  },
  liveMapBadgeCopy: {
    gap: 2,
  },
  liveMapBadgeTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#243040",
  },
  liveMapBadgeText: {
    fontSize: 11,
    color: "#6A7480",
  },
  customerGlow: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFB8CB",
  },
  liveMeterTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#F9DFC0",
    overflow: "hidden",
  },
  liveMeterFill: {
    width: "72%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#E8792A",
  },
  liveHint: {
    fontSize: 13,
    lineHeight: 19,
    color: "#9B5324",
  },
  mapMarkerWrap: {
    alignItems: "center",
  },
  riderPinOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#243040",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  customerPinOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FFD4E0",
  },
  customerPinInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F5",
  },
  mapPointerDark: {
    marginTop: -2,
    width: 10,
    height: 10,
    borderRadius: 4,
    transform: [{ rotate: "45deg" }],
    backgroundColor: "#243040",
  },
  mapPointerSoft: {
    marginTop: -4,
    width: 10,
    height: 10,
    borderRadius: 4,
    transform: [{ rotate: "45deg" }],
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#FFD4E0",
  },
  infoPanel: {
    borderRadius: 22,
    backgroundColor: "#FFFDFC",
    borderWidth: 1,
    borderColor: "#EEDFD2",
    padding: 18,
    gap: 6,
  },
  infoPanelTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#243040",
  },
  infoPanelText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#667482",
  },
  profileCard: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EEDFD2",
    backgroundColor: "#FFFDFC",
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2937",
  },
  profileAvatarText: {
    color: "#FFF9F4",
    fontSize: 22,
    fontWeight: "800",
  },
  profileCopy: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#243040",
  },
  profileMeta: {
    fontSize: 14,
    color: "#667482",
  },
  profileActionCard: {
    borderRadius: 22,
    backgroundColor: "#FFFDFC",
    borderWidth: 1,
    borderColor: "#EEDFD2",
    padding: 18,
    gap: 12,
  },
  profileActionCopy: {
    gap: 4,
  },
  profileActionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#243040",
  },
  profileActionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#667482",
  },
  profileActionButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#FFF2E4",
  },
  profileActionButtonActive: {
    backgroundColor: "#1F2937",
  },
  profileActionButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#9B5324",
  },
  profileActionButtonTextActive: {
    color: "#FFF8F1",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#243040",
  },
  orderCard: {
    borderRadius: 24,
    backgroundColor: "#FFFDFC",
    borderWidth: 1,
    borderColor: "#EEDFD2",
    padding: 18,
    gap: 12,
  },
  liveOrderCard: {
    borderColor: "#F0C58D",
    backgroundColor: "#FFF8EE",
  },
  orderCardTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  orderMetaColumn: {
    flex: 1,
    gap: 5,
  },
  orderCode: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#D36F2A",
  },
  orderRestaurant: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: "#1F2937",
  },
  orderAddress: {
    fontSize: 14,
    lineHeight: 20,
    color: "#667482",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F5F0EA",
  },
  statusBadgeLive: {
    backgroundColor: "#1F2937",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6A7480",
  },
  statusBadgeTextLive: {
    color: "#FFF8F1",
  },
  orderMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7A8794",
  },
  metaDot: {
    color: "#B2BCC7",
  },
  footerText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#7C644C",
  },
  secondaryButton: {
    borderRadius: 16,
    backgroundColor: "#F0802C",
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFF9F4",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  emptyCard: {
    borderRadius: 22,
    backgroundColor: "#FFFDFC",
    borderWidth: 1,
    borderColor: "#EEDFD2",
    padding: 18,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#243040",
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#667482",
  },
  skeletonCard: {
    borderRadius: 24,
    backgroundColor: "#FFFDFC",
    borderWidth: 1,
    borderColor: "#F0E7DF",
    padding: 18,
    gap: 10,
  },
  skeletonLineShort: {
    width: "28%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "#F1E5DA",
  },
  skeletonLine: {
    width: "72%",
    height: 16,
    borderRadius: 999,
    backgroundColor: "#F5ECE4",
  },
  skeletonLineMuted: {
    width: "48%",
    height: 12,
    borderRadius: 999,
    backgroundColor: "#F2EAE4",
  },
});
