import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FavoriteButton } from "@/components/favorite-button";
import { RestaurantCardListSkeleton } from "@/components/restaurant-skeletons";
import { useAuthStore } from "@/lib/auth-store";
import { dummyRestaurants } from "@/lib/customer-data";
import { useFavoritesQuery } from "@/lib/favorite-queries";
import { useFavoriteStore } from "@/lib/favorite-store";
import { useDeliveryLocation } from "@/lib/location-store";
import {
  formatDistanceKm,
  getRestaurantDistanceKm,
  sortRestaurantsByDistance,
} from "@/lib/restaurant-utils";

export default function FavoritesScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const deliveryLocation = useDeliveryLocation();
  const guestFavoriteIds = useFavoriteStore((state) => state.favoriteIds);
  const { data: favoritesData, isLoading } = useFavoritesQuery(Boolean(user?.id));

  const favoriteRestaurants = useMemo(() => {
    if (!user) {
      const ids = new Set(guestFavoriteIds);
      return sortRestaurantsByDistance({
        restaurants: dummyRestaurants.filter((restaurant) =>
          ids.has(restaurant.id),
        ),
        latitude: deliveryLocation.latitude,
        longitude: deliveryLocation.longitude,
      });
    }

    const restaurants = favoritesData?.restaurants ?? [];

    return [...restaurants].sort((a, b) => {
      const aDistance = getRestaurantDistanceKm({
        restaurant: a,
        latitude: deliveryLocation.latitude,
        longitude: deliveryLocation.longitude,
      });
      const bDistance = getRestaurantDistanceKm({
        restaurant: b,
        latitude: deliveryLocation.latitude,
        longitude: deliveryLocation.longitude,
      });

      return aDistance - bDistance;
    });
  }, [
    deliveryLocation.latitude,
    deliveryLocation.longitude,
    favoritesData?.restaurants,
    guestFavoriteIds,
    user,
  ]);

  const savedCount = user ? favoriteRestaurants.length : guestFavoriteIds.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBlobOne} />
          <View style={styles.heroBlobTwo} />
          <Text style={styles.heroTitle}>Favourites</Text>
          <Text style={styles.heroText}>
            Your saved restaurants stay here for quick re-ordering.
          </Text>
          <View style={styles.heroPill}>
            <Ionicons name="heart" size={14} color="#FF5D8F" />
            <Text style={styles.heroPillText}>{savedCount} saved</Text>
          </View>
        </View>

        {!user && guestFavoriteIds.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="person-circle-outline" size={28} color="#24314A" />
            </View>
            <Text style={styles.emptyTitle}>Login to sync favourites</Text>
            <Text style={styles.emptyText}>
              Hearted restaurants will stay safely in your account after login.
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() =>
                router.push({
                  pathname: "/login",
                  params: { redirectTo: "/(tabs)/favorites" },
                })
              }
            >
              <Text style={styles.emptyButtonText}>Login</Text>
            </Pressable>
          </View>
        ) : user && isLoading ? (
          <RestaurantCardListSkeleton count={3} />
        ) : favoriteRestaurants.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="heart-outline" size={28} color="#24314A" />
            </View>
            <Text style={styles.emptyTitle}>No favourites yet</Text>
            <Text style={styles.emptyText}>
              Tap the heart icon on any restaurant and it will show up here.
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() =>
                user
                  ? router.push("/(tabs)/discover")
                  : router.push({
                      pathname: "/login",
                      params: { redirectTo: "/(tabs)/favorites" },
                    })
              }
            >
              <Text style={styles.emptyButtonText}>
                {user ? "Browse restaurants" : "Login"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {!user ? (
              <View style={styles.syncNote}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#24314A"
                />
                <Text style={styles.syncNoteText}>
                  Login korle favourites account-er sathe sync thakbe.
                </Text>
              </View>
            ) : null}
            {favoriteRestaurants.map((restaurant) => (
              <View key={restaurant.id} style={styles.restaurantCard}>
                <Pressable
                  style={styles.restaurantPressable}
                  onPress={() =>
                    router.push({
                      pathname: "/restaurant/[id]",
                      params: { id: restaurant.id },
                    })
                  }
                >
                  <Image
                    source={{ uri: restaurant.coverImage }}
                    style={styles.restaurantImage}
                    contentFit="cover"
                  />
                  <View style={styles.restaurantBody}>
                    <View style={styles.restaurantTopRow}>
                      <Text style={styles.restaurantName}>{restaurant.name}</Text>
                      <View style={styles.ratingPill}>
                        <Ionicons name="star" size={11} color="#F29D18" />
                        <Text style={styles.ratingPillText}>
                          {restaurant.rating.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.restaurantMeta}>
                      {restaurant.cuisine} | {restaurant.deliveryTime}
                    </Text>
                    <View style={styles.restaurantBottomRow}>
                      <Text style={styles.restaurantDistance}>
                        {formatDistanceKm(
                          getRestaurantDistanceKm({
                            restaurant,
                            latitude: deliveryLocation.latitude,
                            longitude: deliveryLocation.longitude,
                          }),
                        )}
                      </Text>
                      <View style={styles.restaurantBadgeRow}>
                        {restaurant.voucher ? (
                          <View style={styles.voucherPill}>
                            <Ionicons
                              name="ticket-outline"
                              size={11}
                              color="#FF5D8F"
                            />
                            <Text style={styles.voucherText}>
                              {restaurant.voucher}
                            </Text>
                          </View>
                        ) : null}
                        <Text style={styles.restaurantPrice}>
                          From {restaurant.startingPrice}tk
                        </Text>
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
    gap: 22,
  },
  heroCard: {
    marginTop: 4,
    padding: 18,
    borderRadius: 34,
    backgroundColor: "#FFE8F0",
    overflow: "hidden",
    gap: 10,
  },
  heroBlobOne: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#FF5D8F",
    opacity: 0.18,
    top: -44,
    right: -34,
  },
  heroBlobTwo: {
    position: "absolute",
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "#FFD166",
    opacity: 0.28,
    bottom: -26,
    left: -20,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#20263A",
  },
  heroText: {
    maxWidth: 260,
    fontSize: 14,
    lineHeight: 20,
    color: "#7B6F69",
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
    backgroundColor: "rgba(255,255,255,0.84)",
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#20263A",
  },
  list: {
    gap: 14,
  },
  syncNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#FFF7F2",
  },
  syncNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#6F6A77",
  },
  restaurantCard: {
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
  restaurantPressable: {
    flex: 1,
  },
  restaurantImage: {
    width: "100%",
    height: 176,
  },
  restaurantBody: {
    padding: 14,
    gap: 8,
  },
  restaurantTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  restaurantName: {
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
  restaurantMeta: {
    fontSize: 13,
    color: "#7B6F69",
  },
  restaurantBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  restaurantDistance: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7B6F69",
  },
  restaurantBadgeRow: {
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
  restaurantPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24314A",
  },
  favoriteButton: {
    position: "absolute",
    top: 14,
    right: 14,
  },
  emptyCard: {
    paddingHorizontal: 24,
    paddingVertical: 34,
    borderRadius: 30,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE8F0",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#20263A",
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#7B6F69",
  },
  emptyButton: {
    marginTop: 4,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5D8F",
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
