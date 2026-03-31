import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FavoriteButton } from "@/components/favorite-button";
import { dummyRestaurants } from "@/lib/customer-data";
import { useDeliveryLocation } from "@/lib/location-store";
import {
  formatDistanceKm,
  getFeaturedRestaurants,
  getRestaurantDistanceKm,
  getVoucherRestaurants,
} from "@/lib/restaurant-utils";

type CollectionMode = "featured" | "offers";

export default function RestaurantCollectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const deliveryLocation = useDeliveryLocation();
  const mode: CollectionMode = params.mode === "offers" ? "offers" : "featured";

  const restaurants = useMemo(() => {
    if (mode === "offers") {
      return getVoucherRestaurants({
        restaurants: dummyRestaurants,
        latitude: deliveryLocation.latitude,
        longitude: deliveryLocation.longitude,
        limit: 50,
      });
    }

    return getFeaturedRestaurants({
      restaurants: dummyRestaurants,
      latitude: deliveryLocation.latitude,
      longitude: deliveryLocation.longitude,
      limit: 50,
    });
  }, [deliveryLocation.latitude, deliveryLocation.longitude, mode]);

  const title = mode === "offers" ? "Offers near you" : "Featured restaurants";
  const subtitle =
    mode === "offers"
      ? "Restaurants with active vouchers and offer visibility near the selected address."
      : "Curated restaurants that deserve extra home page visibility.";

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
          <Text style={styles.topTitle}>{mode === "offers" ? "Offers" : "Featured"}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBubbleOne} />
          <View style={styles.heroBubbleTwo} />
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroText}>{subtitle}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionAction}>{restaurants.length}</Text>
        </View>

        {restaurants.length > 0 ? (
          <View style={styles.list}>
            {restaurants.map((restaurant) => (
              <View key={restaurant.id} style={styles.card}>
                <Pressable
                  style={styles.cardPressable}
                  onPress={() =>
                    router.push({
                      pathname: "/restaurant/[id]",
                      params: { id: restaurant.id },
                    })
                  }
                >
                  <Image
                    source={{ uri: restaurant.coverImage }}
                    style={styles.cardImage}
                    contentFit="cover"
                  />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{restaurant.name}</Text>
                      <View style={styles.ratingPill}>
                        <Ionicons name="star" size={12} color="#F29D18" />
                        <Text style={styles.ratingPillText}>
                          {restaurant.rating.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardMeta}>
                      {restaurant.cuisine} | {restaurant.deliveryTime}
                    </Text>
                    <View style={styles.cardBottom}>
                      <Text style={styles.cardDistance}>
                        {formatDistanceKm(
                          getRestaurantDistanceKm({
                            restaurant,
                            latitude: deliveryLocation.latitude,
                            longitude: deliveryLocation.longitude,
                          }),
                        )}
                      </Text>
                      <View style={styles.rightMeta}>
                        {restaurant.voucher ? (
                          <View style={styles.voucherPill}>
                            <Ionicons name="ticket-outline" size={11} color="#FF5D8F" />
                            <Text style={styles.voucherText}>{restaurant.voucher}</Text>
                          </View>
                        ) : null}
                        <Text style={styles.cardPrice}>From {restaurant.startingPrice}tk</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
                <FavoriteButton
                  restaurantId={restaurant.id}
                  style={styles.favoriteButton}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={mode === "offers" ? "ticket-outline" : "sparkles-outline"}
                size={26}
                color="#24314A"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {mode === "offers"
                ? "No offer restaurants right now"
                : "No featured restaurants right now"}
            </Text>
            <Text style={styles.emptyText}>
              {mode === "offers"
                ? "This area currently has no active vouchers. Try another location or check back soon."
                : "Featured picks are not available for this area yet. Explore nearby restaurants instead."}
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push("/(tabs)/discover")}
            >
              <Text style={styles.emptyButtonText}>Browse restaurants</Text>
            </Pressable>
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
    borderRadius: 32,
    padding: 20,
    backgroundColor: "#EEF3FF",
    overflow: "hidden",
    gap: 10,
  },
  heroBubbleOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#7BDFF2",
    top: -60,
    right: -42,
    opacity: 0.34,
  },
  heroBubbleTwo: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#FFD166",
    bottom: -30,
    left: -24,
    opacity: 0.34,
  },
  heroTitle: {
    maxWidth: 250,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
    color: "#20263A",
  },
  heroText: {
    maxWidth: 300,
    fontSize: 14,
    lineHeight: 21,
    color: "#6F6A77",
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
  list: {
    gap: 14,
  },
  card: {
    position: "relative",
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardPressable: {
    flex: 1,
  },
  cardImage: {
    width: "100%",
    height: 184,
  },
  favoriteButton: {
    position: "absolute",
    top: 14,
    right: 14,
  },
  cardBody: {
    padding: 14,
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: "#20263A",
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FFF1CC",
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9B6500",
  },
  cardMeta: {
    fontSize: 13,
    color: "#7B6F69",
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardDistance: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7B6F69",
  },
  rightMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voucherPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFE8F0",
  },
  voucherText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FF5D8F",
  },
  cardPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24314A",
  },
  emptyState: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 34,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },
  emptyIcon: {
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
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#7B6F69",
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 4,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5C7CFA",
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
