import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/lib/auth-store";
import { getCartBreakdown, useCartStore } from "@/lib/cart-store";
import { dummyRestaurants } from "@/lib/customer-data";
import { emitGuideBuddyEvent } from "@/lib/guide-buddy";
import {
  setDeliveryLocation,
  useDeliveryLocation,
  useSavedLocations,
} from "@/lib/location-store";
import { useOrderStore } from "@/lib/order-store";
import { getPaymentMethodMeta, usePaymentStore } from "@/lib/payment-store";
import { useUIStore } from "@/lib/ui-store";

export default function CheckoutScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const restaurantId = useCartStore((state) => state.restaurantId);
  const thresholdOffer = useCartStore((state) => state.thresholdOffer);
  const couponDiscountTk = useCartStore((state) => state.couponDiscountTk);
  const clearCart = useCartStore((state) => state.clearCart);
  const placeOrderFromCart = useOrderStore((state) => state.placeOrderFromCart);
  const showToast = useUIStore((state) => state.showToast);
  const selectedPaymentMethod = usePaymentStore(
    (state) => state.selectedMethod,
  );
  const location = useDeliveryLocation();
  const savedLocations = useSavedLocations();

  const [placingOrder, setPlacingOrder] = useState(false);

  const breakdown = getCartBreakdown({
    items,
    couponDiscountTk,
    thresholdOffer,
  });
  const paymentMethod = useMemo(
    () => getPaymentMethodMeta(selectedPaymentMethod),
    [selectedPaymentMethod],
  );

  const handlePlaceOrder = async () => {
    if (!user) {
      showToast("Login is required to continue to checkout.");
      return;
    }

    if (!restaurantId || Object.keys(items).length === 0) {
      showToast("Your cart is empty.");
      return;
    }

    const restaurant = dummyRestaurants.find(
      (entry) => entry.id === restaurantId,
    );

    if (!restaurant) {
      showToast("Restaurant information is unavailable right now.");
      return;
    }

    setPlacingOrder(true);

    try {
      const result = placeOrderFromCart({
        restaurant,
        items: Object.values(items).map((item) => ({
          cartKey: item.cartKey,
          itemId: item.itemId,
          name: item.name,
          quantity: item.quantity,
          unitTk: item.unitTk,
          summary: item.summary,
        })),
        subtotalTk: breakdown.subtotalTk,
        deliveryTk: breakdown.deliveryTk,
        serviceFeeTk: breakdown.serviceFeeTk,
        discountTk: breakdown.discountTk,
        totalTk: breakdown.totalTk,
        paymentMethod: selectedPaymentMethod,
        deliveryAddress: [location.label, location.subtitle]
          .filter(Boolean)
          .join(", "),
        note: "Rider will call on arrival.",
      });

      clearCart();
      emitGuideBuddyEvent("order_placed");
      Vibration.vibrate([0, 50, 30, 70]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: "/tracking",
        params: {
          fresh: "1",
          locked: "1",
          payment: selectedPaymentMethod,
          orderId: result.order.id,
        },
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar style="dark" backgroundColor="#FFF7F2" />
        <View style={styles.loginWrap}>
          <View style={styles.loginBubble}>
            <Ionicons name="lock-closed-outline" size={28} color="#20263A" />
          </View>
          <Text style={styles.loginTitle}>Login required</Text>
          <Text style={styles.loginText}>
            Please login before placing your order.
          </Text>
          <Pressable
            style={styles.loginButton}
            onPress={() =>
              router.replace({
                pathname: "/login",
                params: { redirectTo: "/checkout" },
              })
            }
          >
            <Text style={styles.loginButtonText}>Login to continue</Text>
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
          <Text style={styles.topTitle}>Checkout</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.addressCard}>
          <View style={styles.addressTopRow}>
            <View style={styles.addressHeadingWrap}>
              <Text style={styles.cardEyebrow}>Delivery address</Text>
              <Text style={styles.addressTitle}>{location.label}</Text>
              <Text style={styles.addressText}>{location.subtitle}</Text>
            </View>
            <Pressable
              style={styles.manageButton}
              onPress={() => router.push("/saved-addresses")}
            >
              <Text style={styles.manageButtonText}>Manage</Text>
            </Pressable>
          </View>

          <View style={styles.savedLocationHeader}>
            <Text style={styles.savedLocationTitle}>
              Choose from saved locations
            </Text>
            {/* <Text style={styles.savedLocationHint}>Tap one or update from manage</Text> */}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.savedLocationRow}
          >
            {savedLocations.map((savedLocation) => {
              const isSelected =
                location.label === savedLocation.label &&
                location.subtitle === savedLocation.subtitle;

              return (
                <Pressable
                  key={savedLocation.id}
                  style={[
                    styles.savedLocationCard,
                    isSelected && styles.savedLocationCardSelected,
                  ]}
                  onPress={() => {
                    setDeliveryLocation(savedLocation);
                    showToast("Delivery location updated.");
                  }}
                >
                  <View style={styles.savedLocationCardTop}>
                    <View style={styles.savedLocationIcon}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color="#24314A"
                      />
                    </View>
                    {isSelected ? (
                      <View style={styles.savedLocationBadge}>
                        <Text style={styles.savedLocationBadgeText}>
                          Selected
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.savedLocationName}>
                    {savedLocation.name}
                  </Text>
                  <Text style={styles.savedLocationLabel} numberOfLines={2}>
                    {savedLocation.label}
                  </Text>
                  <Text style={styles.savedLocationSubtitle}>
                    {savedLocation.subtitle}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              style={[styles.savedLocationCard, styles.savedLocationManageCard]}
              onPress={() => router.push("/saved-addresses")}
            >
              <View style={styles.savedLocationManageIcon}>
                <Ionicons name="create-outline" size={18} color="#24314A" />
              </View>
              <Text style={styles.savedLocationName}>Update one</Text>
              <Text style={styles.savedLocationManageText}>
                Add, edit, or choose from map
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment method</Text>

          <Pressable
            style={[styles.paymentCard, styles.paymentCardActive]}
            onPress={() => router.push("/payment-methods")}
          >
            <View style={styles.paymentIcon}>
              <Ionicons
                name={paymentMethod.icon}
                size={18}
                color={
                  selectedPaymentMethod === "bkash" ? "#D63384" : "#2FBF71"
                }
              />
            </View>
            <View style={styles.paymentCopy}>
              <Text style={styles.paymentTitle}>{paymentMethod.title}</Text>
              <Text style={styles.paymentText}>{paymentMethod.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8A7E75" />
          </Pressable>

          <View style={styles.paymentMetaCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#24314A"
            />
            <Text style={styles.paymentMetaText}>
              {selectedPaymentMethod === "bkash"
                ? "bKash is selected for checkout. You can plug in the real payment flow later."
                : "COD keeps the payment simple for the customer."}
            </Text>
          </View>
        </View>

        <View style={styles.optionList}>
          <View style={styles.optionRow}>
            <View style={styles.optionIcon}>
              <Ionicons name={paymentMethod.icon} size={18} color="#24314A" />
            </View>
            <Text style={styles.optionText}>{paymentMethod.title}</Text>
          </View>
          <View style={styles.optionRow}>
            <View style={styles.optionIcon}>
              <Ionicons name="call-outline" size={18} color="#24314A" />
            </View>
            <Text style={styles.optionText}>Rider will call on arrival</Text>
          </View>
        </View>

        <View style={styles.billCard}>
          <Text style={styles.billHeading}>Payment summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items</Text>
            <Text style={styles.billValue}>TK {breakdown.subtotalTk}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery</Text>
            <Text style={styles.billValue}>TK {breakdown.deliveryTk}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Service fee</Text>
            <Text style={styles.billValue}>TK {breakdown.serviceFeeTk}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Discount</Text>
            <Text style={styles.billValue}>-TK {breakdown.discountTk}</Text>
          </View>
          {breakdown.thresholdDiscountTk > 0 ? (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Threshold offer</Text>
              <Text style={styles.billValue}>
                -TK {breakdown.thresholdDiscountTk}
              </Text>
            </View>
          ) : null}
          {breakdown.couponDiscountTk > 0 ? (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Coupon</Text>
              <Text style={styles.billValue}>
                -TK {breakdown.couponDiscountTk}
              </Text>
            </View>
          ) : null}
          <View style={[styles.billRow, styles.billStrongRow]}>
            <Text style={styles.billStrongLabel}>Total to pay</Text>
            <Text style={styles.billStrongValue}>TK {breakdown.totalTk}</Text>
          </View>
        </View>

        <Pressable
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place order</Text>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF7F2" },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 32, gap: 18 },
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
  topTitle: { fontSize: 18, fontWeight: "900", color: "#20263A" },
  placeholder: { width: 44 },
  addressCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#FFFFFF",
    gap: 14,
  },
  addressTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  addressHeadingWrap: {
    flex: 1,
    gap: 8,
  },
  cardEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#8A7E75",
  },
  addressTitle: { fontSize: 22, fontWeight: "900", color: "#20263A" },
  addressText: { fontSize: 14, color: "#7B6F69" },
  manageButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F0EB",
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#24314A",
  },
  savedLocationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  savedLocationTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#20263A",
  },
  savedLocationHint: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8A7E75",
  },
  savedLocationRow: {
    gap: 12,
    paddingRight: 18,
  },
  savedLocationCard: {
    width: 172,
    borderRadius: 22,
    padding: 14,
    gap: 8,
    backgroundColor: "#FFF7F2",
    borderWidth: 1,
    borderColor: "#FFF7F2",
  },
  savedLocationCardSelected: {
    borderColor: "#CFEEDC",
    backgroundColor: "#F4FFF8",
  },
  savedLocationCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  savedLocationIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  savedLocationBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#E7F8EE",
  },
  savedLocationBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1F9D57",
  },
  savedLocationName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#20263A",
  },
  savedLocationLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#20263A",
  },
  savedLocationSubtitle: {
    fontSize: 12,
    color: "#7B6F69",
  },
  savedLocationManageCard: {
    justifyContent: "center",
  },
  savedLocationManageIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1CC",
  },
  savedLocationManageText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6F6A77",
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#20263A" },
  paymentSection: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "#FFF7F2",
    borderWidth: 1,
    borderColor: "#FFF7F2",
  },
  paymentCardActive: {
    borderColor: "#CFEEDC",
    backgroundColor: "#F4FFF8",
  },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  paymentCopy: {
    flex: 1,
    gap: 3,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#20263A",
  },
  paymentText: {
    fontSize: 13,
    color: "#7B6F69",
  },
  paymentMetaCard: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 18,
    backgroundColor: "#FFF8E8",
  },
  paymentMetaText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#6F6A77",
  },
  optionList: { gap: 12 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  optionText: { flex: 1, fontSize: 14, fontWeight: "800", color: "#20263A" },
  billCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#FFF1E8",
    gap: 12,
  },
  billHeading: { fontSize: 20, fontWeight: "900", color: "#20263A" },
  billRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  billLabel: { fontSize: 14, color: "#7B6F69" },
  billValue: { fontSize: 14, fontWeight: "800", color: "#20263A" },
  billStrongRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0D9D5",
  },
  billStrongLabel: { fontSize: 16, fontWeight: "900", color: "#20263A" },
  billStrongValue: { fontSize: 16, fontWeight: "900", color: "#20263A" },
  placeOrderButton: {
    minHeight: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FF5D8F",
  },
  placeOrderText: { fontSize: 15, fontWeight: "900", color: "#FFFFFF" },
  loginWrap: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: "#FFF7F2",
  },
  loginBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  loginTitle: { fontSize: 24, fontWeight: "900", color: "#20263A" },
  loginText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#7B6F69",
    textAlign: "center",
  },
  loginButton: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5C7CFA",
  },
  loginButtonText: { fontSize: 15, fontWeight: "900", color: "#FFFFFF" },
});
