import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useRouter, useSegments } from "expo-router";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getCartBreakdown,
  getCartSuggestions,
  useCartStore,
} from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { dummyRestaurants } from "@/lib/customer-data";
import { useOrderQuoteQuery } from "@/lib/order-queries";
import { useUIStore } from "@/lib/ui-store";

export default function CartScreen() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const [couponCode, setCouponCode] = useState("");

  const restaurantId = useCartStore((state) => state.restaurantId);
  const restaurantName = useCartStore((state) => state.restaurantName);
  const items = useCartStore((state) => state.items);
  const thresholdOffer = useCartStore((state) => state.thresholdOffer);
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const couponDiscountTk = useCartStore((state) => state.couponDiscountTk);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const addItem = useCartStore((state) => state.addItem);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const clearCoupon = useCartStore((state) => state.clearCoupon);
  const showToast = useUIStore((state) => state.showToast);
  const user = useAuthStore((state) => state.user);

  const restaurant = dummyRestaurants.find((item) => item.id === restaurantId);
  const cartItems = Object.values(items);
  const suggestions = useMemo(
    () => getCartSuggestions(restaurant, items),
    [items, restaurant],
  );
  const insideTabs = segments[0] === "(tabs)";
  const tabBarClearance = insideTabs ? 104 : 14;
  const breakdown = getCartBreakdown({ items, couponDiscountTk, thresholdOffer });
  const quotePayload = useMemo(
    () => ({
      restaurantId: restaurantId ?? "",
      items: cartItems
        .slice()
        .sort((left, right) => left.cartKey.localeCompare(right.cartKey))
        .map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitTk: item.unitTk,
          summary: item.summary,
        })),
      couponCode: appliedCoupon,
    }),
    [appliedCoupon, cartItems, restaurantId],
  );
  const deferredQuotePayload = useDeferredValue(quotePayload);
  const {
    data: quote,
    error: quoteError,
    isFetching: isQuoteFetching,
  } = useOrderQuoteQuery(
    deferredQuotePayload,
    Boolean(restaurantId && deferredQuotePayload.items.length > 0),
  );
  const localThresholdOffer = useMemo(
    () =>
      !appliedCoupon && breakdown.thresholdReached
        ? {
            type: "threshold_discount",
            title: "Restaurant offer",
            shortLabel: `TK ${breakdown.thresholdDiscountValueTk} OFF`,
            code: "",
            discountTk: breakdown.thresholdDiscountTk,
            freeDeliveryApplied: false,
            isAutoApply: true,
          }
        : undefined,
    [
      appliedCoupon,
      breakdown.thresholdDiscountTk,
      breakdown.thresholdDiscountValueTk,
      breakdown.thresholdReached,
    ],
  );
  const pricing = useMemo(() => {
    const shouldPreferLocalThreshold =
      !appliedCoupon &&
      breakdown.thresholdReached &&
      (quote?.discountTk ?? 0) < breakdown.thresholdDiscountTk;

    if (shouldPreferLocalThreshold) {
      return {
        subtotalTk: breakdown.subtotalTk,
        deliveryTk: breakdown.deliveryTk,
        serviceFeeTk: breakdown.serviceFeeTk,
        discountTk: breakdown.discountTk,
        totalTk: breakdown.totalTk,
        couponCode: null,
        appliedOffer: localThresholdOffer,
      };
    }

    return (
      quote ?? {
        subtotalTk: breakdown.subtotalTk,
        deliveryTk: breakdown.deliveryTk,
        serviceFeeTk: breakdown.serviceFeeTk,
        discountTk: breakdown.discountTk,
        totalTk: breakdown.totalTk,
        couponCode: appliedCoupon,
        appliedOffer: localThresholdOffer,
      }
    );
  }, [
    appliedCoupon,
    breakdown.deliveryTk,
    breakdown.discountTk,
    breakdown.serviceFeeTk,
    breakdown.subtotalTk,
    breakdown.thresholdDiscountTk,
    breakdown.thresholdReached,
    breakdown.totalTk,
    localThresholdOffer,
    quote,
  ]);
  const appliedOffer = pricing.appliedOffer;
  const offerLineLabel = appliedOffer?.title || "Offer";
  const thresholdProgress = Math.min(
    breakdown.thresholdEnabled && breakdown.thresholdTargetTk > 0
      ? breakdown.subtotalTk / breakdown.thresholdTargetTk
      : 0,
    1,
  );
  const thresholdCelebrate = useRef(new Animated.Value(breakdown.thresholdReached ? 1 : 0)).current;
  const thresholdPulse = useRef(new Animated.Value(1)).current;
  const thresholdReachedRef = useRef(breakdown.thresholdReached);

  useEffect(() => {
    if (breakdown.thresholdReached && !thresholdReachedRef.current) {
      thresholdCelebrate.setValue(0);
      thresholdPulse.setValue(0.98);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Animated.parallel([
        Animated.timing(thresholdCelebrate, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(thresholdPulse, {
            toValue: 1.04,
            speed: 18,
            bounciness: 10,
            useNativeDriver: true,
          }),
          Animated.spring(thresholdPulse, {
            toValue: 1,
            speed: 18,
            bounciness: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }

    if (!breakdown.thresholdReached) {
      thresholdCelebrate.setValue(0);
      thresholdPulse.setValue(1);
    }

    thresholdReachedRef.current = breakdown.thresholdReached;
  }, [breakdown.thresholdReached, thresholdCelebrate, thresholdPulse]);

  const handleApplyCoupon = () => {
    const result = applyCoupon(couponCode);
    showToast(result.message);
    if (result.ok) {
      setCouponCode("");
    }
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar style="dark" backgroundColor="#FFF7F2" />
        <View style={styles.emptyWrap}>
          <View style={styles.emptyBubble}>
            <Ionicons name="bag-handle-outline" size={28} color="#20263A" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add something tasty from one restaurant to start.</Text>
          <Pressable style={styles.emptyButton} onPress={() => router.push("/(tabs)/home")}>
            <Text style={styles.emptyButtonText}>Browse food</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + tabBarClearance + 132 },
        ]}
      >
        <View style={styles.topRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#20263A" />
          </Pressable>
          <Text style={styles.topTitle}>Your cart</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            {restaurant?.coverImage ? (
              <Image
                source={{ uri: restaurant.coverImage }}
                style={styles.summaryImage}
              />
            ) : (
              <View
                style={[
                  styles.summaryImageFallback,
                  { backgroundColor: restaurant?.accent ?? "#FFF1CC" },
                ]}
              >
                <Ionicons
                  name={(restaurant?.icon as never) ?? "restaurant-outline"}
                  size={24}
                  color="#20263A"
                />
              </View>
            )}

            <View style={styles.summaryCopy}>
              <View style={styles.summaryLabelRow}>
                <Text style={styles.summaryLabel}>{restaurantName}</Text>
                <View style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeText}>1 restaurant</Text>
                </View>
              </View>
              <Text style={styles.summaryMeta}>
                {restaurant?.cuisine ?? "Restaurant"} | {restaurant?.deliveryTime ?? "Fast delivery"}
              </Text>
                <Text style={styles.summaryText}>
                  {restaurant?.voucher
                    ? `${restaurant.voucher} available on selected orders`
                    : "Review your order before checkout."}
                </Text>
            </View>
          </View>
          <View style={styles.summaryBottomRow}>
            <Text style={styles.summaryAmount}>TK {pricing.totalTk}</Text>
            <Text style={styles.summaryMiniText}>
              {isQuoteFetching ? "Checking latest total..." : `Cart from ${restaurantName}`}
            </Text>
          </View>
        </View>

        {breakdown.thresholdEnabled ? (
          <Animated.View
            style={[
              styles.thresholdCard,
              breakdown.thresholdReached && styles.thresholdCardActive,
              { transform: [{ scale: thresholdPulse }] },
            ]}
          >
            <View style={styles.thresholdTop}>
              <View>
                <Text style={styles.thresholdTitle}>Restaurant offer</Text>
                <Text style={styles.thresholdText}>
                  {appliedCoupon
                    ? "Coupon offer is active now. Remove it to unlock the restaurant offer."
                    : breakdown.thresholdReached
                    ? `Nice. You unlocked TK ${breakdown.thresholdDiscountValueTk} off automatically.`
                    : `Add TK ${breakdown.thresholdRemainingTk} more to unlock TK ${breakdown.thresholdDiscountValueTk} off.`}
                </Text>
              </View>
              <View
                style={[
                  styles.thresholdBadge,
                  breakdown.thresholdReached && styles.thresholdBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.thresholdBadgeText,
                    breakdown.thresholdReached && styles.thresholdBadgeTextActive,
                  ]}
                >
                  TK {breakdown.thresholdDiscountValueTk}
                </Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${thresholdProgress * 100}%`,
                    backgroundColor: appliedCoupon
                      ? "#8AA0FF"
                      : breakdown.thresholdReached
                        ? "#2FBF71"
                        : "#FFB100",
                  },
                ]}
              />
            </View>
            {breakdown.thresholdReached ? (
              <Animated.View
                style={[
                  styles.thresholdSuccessRow,
                  {
                    opacity: thresholdCelebrate,
                    transform: [
                      {
                        translateY: thresholdCelebrate.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="sparkles" size={14} color="#1F9D57" />
                <Text style={styles.thresholdSuccessText}>
                  Offer unlocked. TK {breakdown.thresholdDiscountValueTk} discount added.
                </Text>
              </Animated.View>
            ) : null}
            <View style={styles.thresholdBottom}>
              <Text style={styles.thresholdMeta}>Current: TK {breakdown.subtotalTk}</Text>
              <Text style={styles.thresholdMeta}>
                Goal: TK {breakdown.thresholdTargetTk}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        <View style={styles.cartList}>
          {cartItems.map((item) => (
            <View key={item.cartKey} style={styles.cartCard}>
              <View style={[styles.cartIcon, { backgroundColor: item.accent }]}>
                <Ionicons name={item.icon as never} size={22} color="#20263A" />
              </View>
              <View style={styles.cartCopy}>
                <Text style={styles.cartName}>{item.name}</Text>
                <Text style={styles.cartMeta}>{item.summary || item.restaurantName}</Text>
                <Text style={styles.cartPrice}>TK {item.unitTk}</Text>
              </View>
              <View style={styles.qtyBar}>
                <Pressable style={styles.qtyButton} onPress={() => decrementItem(item.cartKey)}>
                  <Ionicons
                    name={item.quantity === 1 ? "trash-outline" : "remove"}
                    size={14}
                    color="#6F6A77"
                  />
                </Pressable>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <Pressable style={[styles.qtyButton, styles.qtyButtonActive]} onPress={() => incrementItem(item.cartKey)}>
                  <Ionicons name="add" size={14} color="#FFB100" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {restaurant ? (
          <Pressable
            style={styles.addMoreLink}
            onPress={() => router.push(`/restaurant/${restaurant.id}` as never)}
          >
            <View style={styles.addMoreIcon}>
              <Ionicons name="add" size={16} color="#24314A" />
            </View>
            <View style={styles.addMoreCopy}>
              <Text style={styles.addMoreTitle}>Add more item</Text>
              <Text style={styles.addMoreText}>
                Go back to {restaurant.name} and add more food
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8A7E75" />
          </Pressable>
        ) : null}

        <View style={styles.couponCard}>
          <View style={styles.couponTop}>
            <Text style={styles.couponTitle}>Coupon</Text>
            {appliedCoupon ? (
              <Pressable onPress={clearCoupon}>
                <Text style={styles.clearCouponText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.couponRow}>
            <TextInput
              value={couponCode}
              onChangeText={setCouponCode}
              placeholder="Enter code like YUMMELA"
              placeholderTextColor="#9D9188"
              autoCapitalize="characters"
              style={styles.couponInput}
            />
            <Pressable style={styles.couponButton} onPress={handleApplyCoupon}>
              <Text style={styles.couponButtonText}>Apply</Text>
            </Pressable>
          </View>
          {appliedCoupon ? (
            <Text style={styles.couponAppliedText}>
              Applied: {appliedCoupon}
            </Text>
          ) : null}
          {quoteError ? (
            <Text style={styles.couponErrorText}>
              {quoteError instanceof Error
                ? quoteError.message
                : "Coupon or offer could not be verified right now."}
            </Text>
          ) : null}
        </View>

        <View style={styles.billCard}>
          <Text style={styles.billHeading}>Payment summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items</Text>
            <Text style={styles.billValue}>TK {pricing.subtotalTk}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery</Text>
            <Text style={styles.billValue}>TK {pricing.deliveryTk}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Service fee</Text>
            <Text style={styles.billValue}>TK {pricing.serviceFeeTk}</Text>
          </View>
          {pricing.discountTk > 0 ? (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>{offerLineLabel}</Text>
              <Text style={styles.billValue}>-TK {pricing.discountTk}</Text>
            </View>
          ) : null}
          <View style={[styles.billRow, styles.billStrongRow]}>
            <Text style={styles.billStrongLabel}>Total</Text>
            <Text style={styles.billStrongValue}>TK {pricing.totalTk}</Text>
          </View>
        </View>

        {suggestions.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular with your order</Text>
              <Text style={styles.sectionAction}>Others customers also added</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRail}>
              {suggestions.map((item) => (
                <View key={item.id} style={styles.suggestionCard}>
                  <View style={[styles.suggestionArtwork, { backgroundColor: item.accent }]}>
                    <Ionicons name={item.icon as never} size={30} color="#20263A" />
                  </View>
                  <Text style={styles.suggestionName}>{item.name}</Text>
                  <Text style={styles.suggestionPrice}>TK {Math.round(item.price)}</Text>
                  <Pressable
                    style={styles.suggestionAdd}
                    onPress={() => {
                      if (!restaurant) return;
                      addItem({
                        restaurant,
                        item,
                        unitTk: Math.round(item.price),
                        configuration: {
                          selectedOptions: [],
                          selectedAddons: [],
                          selectedBundleSuggestionIds: [],
                        },
                      });
                    }}
                  >
                    <Ionicons name="add" size={14} color="#FFB100" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.checkoutWrap,
          { bottom: insets.bottom + tabBarClearance },
        ]}
      >
        <Pressable
          style={styles.checkoutButton}
          onPress={() => {
            if (!user) {
              showToast("Login to continue to checkout.");
              router.push({
                pathname: "/login",
                params: { redirectTo: "/checkout" },
              });
              return;
            }

            if (quoteError) {
              showToast(
                quoteError instanceof Error
                  ? quoteError.message
                  : "Please review your cart before checkout.",
              );
              return;
            }

            router.push("/checkout");
          }}
        >
          <View style={styles.checkoutCopy}>
            <Text style={styles.checkoutButtonText}>Proceed to checkout</Text>
            <Text style={styles.checkoutButtonSub}>{restaurantName}</Text>
          </View>
          <View style={styles.checkoutAmountPill}>
            <Text style={styles.checkoutAmountText}>TK {pricing.totalTk}</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF7F2" },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 138, gap: 18 },
  topRow: { marginTop: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  topTitle: { fontSize: 18, fontWeight: "900", color: "#20263A" },
  placeholder: { width: 44 },
  summaryCard: { borderRadius: 28, padding: 18, backgroundColor: "#20263A", gap: 8 },
  summaryTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryImage: { width: 72, height: 72, borderRadius: 22, backgroundColor: "#FFF" },
  summaryImageFallback: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  summaryCopy: { flex: 1, gap: 6 },
  summaryLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  summaryLabel: { fontSize: 16, fontWeight: "900", color: "#FFFFFF", flexShrink: 1 },
  summaryBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" },
  summaryBadgeText: { fontSize: 10, fontWeight: "900", color: "#FFD7C7" },
  summaryMeta: { fontSize: 12, fontWeight: "800", color: "#FFD7C7" },
  summaryText: { fontSize: 12, lineHeight: 18, color: "rgba(255,255,255,0.8)" },
  summaryBottomRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginTop: 6 },
  summaryAmount: { fontSize: 30, fontWeight: "900", color: "#FFFFFF" },
  summaryMiniText: { fontSize: 12, fontWeight: "800", color: "rgba(255,255,255,0.76)" },
  thresholdCard: { borderRadius: 24, padding: 16, backgroundColor: "#FFFFFF", gap: 12 },
  thresholdCardActive: { backgroundColor: "#F7FFFA", borderWidth: 1, borderColor: "#CFEEDC" },
  thresholdTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  thresholdTitle: { fontSize: 16, fontWeight: "900", color: "#20263A" },
  thresholdText: { marginTop: 4, fontSize: 13, lineHeight: 19, color: "#7B6F69" },
  thresholdBadge: { minWidth: 62, paddingHorizontal: 12, minHeight: 32, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF1CC" },
  thresholdBadgeActive: { backgroundColor: "#DDF5E4" },
  thresholdBadgeText: { fontSize: 12, fontWeight: "900", color: "#B97700" },
  thresholdBadgeTextActive: { color: "#1F9D57" },
  progressTrack: { height: 10, borderRadius: 999, backgroundColor: "#F2ECE6", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: "#FFB100" },
  thresholdSuccessRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, backgroundColor: "#E7F8EE" },
  thresholdSuccessText: { flex: 1, fontSize: 12, fontWeight: "800", color: "#1F9D57" },
  thresholdBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  thresholdMeta: { fontSize: 12, fontWeight: "700", color: "#8A7E75" },
  cartList: { gap: 12 },
  cartCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 24, backgroundColor: "#FFFFFF" },
  cartIcon: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  cartCopy: { flex: 1, gap: 4 },
  cartName: { fontSize: 16, fontWeight: "900", color: "#20263A" },
  cartMeta: { fontSize: 12, color: "#7B6F69" },
  cartPrice: { fontSize: 13, fontWeight: "800", color: "#20263A" },
  qtyBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999, backgroundColor: "#FFF9F4" },
  qtyButton: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#F0ECE8" },
  qtyButtonActive: { backgroundColor: "#FFF1CC" },
  qtyText: { minWidth: 12, textAlign: "center", fontSize: 13, fontWeight: "800", color: "#20263A" },
  addMoreLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  addMoreIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1CC",
  },
  addMoreCopy: {
    flex: 1,
    gap: 4,
  },
  addMoreTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#20263A",
  },
  addMoreText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#7B6F69",
  },
  couponCard: { borderRadius: 24, padding: 16, backgroundColor: "#FFFFFF", gap: 12 },
  couponTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  couponTitle: { fontSize: 16, fontWeight: "900", color: "#20263A" },
  clearCouponText: { fontSize: 13, fontWeight: "800", color: "#FF5D8F" },
  couponRow: { flexDirection: "row", gap: 10 },
  couponInput: { flex: 1, minHeight: 52, borderRadius: 18, paddingHorizontal: 14, backgroundColor: "#FFF7F2", fontSize: 14, color: "#20263A" },
  couponButton: { minWidth: 88, minHeight: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#5C7CFA" },
  couponButtonText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  couponAppliedText: { fontSize: 12, fontWeight: "700", color: "#2FBF71" },
  couponErrorText: { fontSize: 12, lineHeight: 18, color: "#D14D72" },
  billCard: { borderRadius: 24, padding: 18, backgroundColor: "#FFF1E8", gap: 12 },
  billHeading: { fontSize: 18, fontWeight: "900", color: "#20263A" },
  billRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  billLabel: { fontSize: 14, color: "#7B6F69" },
  billValue: { fontSize: 14, fontWeight: "800", color: "#20263A" },
  billStrongRow: { paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F0D9D5" },
  billStrongLabel: { fontSize: 16, fontWeight: "900", color: "#20263A" },
  billStrongValue: { fontSize: 16, fontWeight: "900", color: "#20263A" },
  sectionHeader: { gap: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#20263A" },
  sectionAction: { fontSize: 12, color: "#7B6F69" },
  suggestionRail: { gap: 12, paddingRight: 18 },
  suggestionCard: { width: 150, borderRadius: 24, backgroundColor: "#FFFFFF", padding: 12, gap: 8, position: "relative" },
  suggestionArtwork: { height: 90, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  suggestionName: { fontSize: 14, fontWeight: "900", color: "#20263A" },
  suggestionPrice: { fontSize: 12, color: "#7B6F69" },
  suggestionAdd: { position: "absolute", right: 12, bottom: 12, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  checkoutWrap: { position: "absolute", left: 18, right: 18 },
  checkoutButton: { minHeight: 66, borderRadius: 24, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#20263A", shadowColor: "#000000", shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  checkoutCopy: { flex: 1, gap: 3 },
  checkoutButtonText: { fontSize: 15, fontWeight: "900", color: "#FFFFFF" },
  checkoutButtonSub: { fontSize: 12, color: "rgba(255,255,255,0.76)" },
  checkoutAmountPill: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, backgroundColor: "#FFB100" },
  checkoutAmountText: { fontSize: 14, fontWeight: "900", color: "#20263A" },
  emptyWrap: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", gap: 14, backgroundColor: "#FFF7F2" },
  emptyBubble: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: "#FFE8F0" },
  emptyTitle: { fontSize: 24, fontWeight: "900", color: "#20263A" },
  emptyText: { fontSize: 14, lineHeight: 21, color: "#7B6F69", textAlign: "center" },
  emptyButton: { minHeight: 54, paddingHorizontal: 20, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#FF5D8F" },
  emptyButtonText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
});
