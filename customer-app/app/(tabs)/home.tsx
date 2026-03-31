import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
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
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FavoriteButton } from "@/components/favorite-button";
import {
  dummyRestaurants,
  dummyCategories,
  dummyHomePromos,
  dummyHomeQuickPicks,
} from "@/lib/customer-data";
import { getCartCount, useCartStore } from "@/lib/cart-store";
import {
  type DeliveryLocation,
  useSavedLocations,
  setDeliveryLocation,
  useDeliveryLocation,
} from "@/lib/location-store";
import {
  formatDistanceKm,
  getFeaturedRestaurants,
  getNearbyRestaurants,
  getRestaurantDistanceKm,
  getVoucherRestaurants,
} from "@/lib/restaurant-utils";

const divisionShortNames = [
  { match: "dhaka", short: "DHK" },
  { match: "mymensingh", short: "MYM" },
  { match: "chattogram", short: "CTG" },
  { match: "chittagong", short: "CTG" },
  { match: "rajshahi", short: "RAJ" },
  { match: "khulna", short: "KHL" },
  { match: "barishal", short: "BAR" },
  { match: "sylhet", short: "SYL" },
  { match: "rangpur", short: "RNG" },
];

function getShortLocationMeta(location: DeliveryLocation) {
  const source = `${location.label} ${location.subtitle}`.toLowerCase();
  const division =
    divisionShortNames.find((item) => source.includes(item.match))?.short ??
    "MYM";
  const base =
    location.subtitle.split(",")[0].trim() ||
    location.label.split(",")[0].trim() ||
    "Selected";

  return `${base} | ${division}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const selectedLocation = useDeliveryLocation();
  const savedLocations = useSavedLocations();
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);

  const reveal = useRef(new Animated.Value(0)).current;
  const promoScrollX = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(460)).current;
  const sheetBackdrop = useRef(new Animated.Value(0)).current;

  const featuredRestaurants = useMemo(
    () =>
      getFeaturedRestaurants({
        restaurants: dummyRestaurants,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        limit: 6,
      }).map((restaurant) => ({
        restaurant,
        distanceText: formatDistanceKm(
          getRestaurantDistanceKm({
            restaurant,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }),
        ),
      })),
    [selectedLocation.latitude, selectedLocation.longitude],
  );
  const quickRestaurants = useMemo(
    () =>
      getNearbyRestaurants({
        restaurants: dummyRestaurants,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        radiusKm: 3,
      })
        .slice(0, 8)
        .map((restaurant) => ({
          restaurant,
          distanceText: formatDistanceKm(
            getRestaurantDistanceKm({
              restaurant,
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }),
          ),
        })),
    [selectedLocation.latitude, selectedLocation.longitude],
  );
  const voucherRestaurants = useMemo(
    () =>
      getVoucherRestaurants({
        restaurants: dummyRestaurants,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        limit: 6,
      }).map((restaurant) => ({
        restaurant,
        distanceText: formatDistanceKm(
          getRestaurantDistanceKm({
            restaurant,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }),
        ),
      })),
    [selectedLocation.latitude, selectedLocation.longitude],
  );
  const promoCardWidth = Math.min(width - 72, 286);
  const promoSnap = promoCardWidth + 14;
  const compactLocationMeta = useMemo(
    () => getShortLocationMeta(selectedLocation),
    [selectedLocation],
  );
  const cartCount = useCartStore((state) => getCartCount(state.items));
  const hasNearbyRestaurants = quickRestaurants.length > 0;

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reveal]);

  const openSheet = () => {
    setLocationSheetVisible(true);
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetBackdrop, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = (onClosed?: () => void) => {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 460,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetBackdrop, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setLocationSheetVisible(false);
        onClosed?.();
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{
          opacity: reveal,
          transform: [
            {
              translateY: reveal.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        }}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerBlobOne} />
          <View style={styles.headerBlobTwo} />

          <View style={styles.headerTopRow}>
            <Pressable style={styles.locationButton} onPress={openSheet}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={16} color="#20263A" />
              </View>
              <View style={styles.locationTextWrap}>
                <Text numberOfLines={1} style={styles.locationTitle}>
                  {selectedLocation.label}
                </Text>
                <Text style={styles.locationSubtitle}>{compactLocationMeta}</Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="#20263A" />
            </Pressable>

            <Pressable
              style={styles.cartButton}
              onPress={() => router.push("/cart")}
            >
              <Ionicons name="bag-handle-outline" size={20} color="#FFFFFF" />
              {cartCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <Text style={styles.heroTitle}>What are you craving?</Text>

          <View style={styles.quickPickRow}>
            {dummyHomeQuickPicks.map((pick) => (
              <View key={pick.id} style={[styles.quickPickChip, { backgroundColor: pick.color }]}>
                <Ionicons name={pick.icon as never} size={14} color="#20263A" />
                <Text style={styles.quickPickText}>{pick.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {hasNearbyRestaurants ? (
          <>
            <SectionHeader
              title="Categories"
              action="See all"
              onPress={() => router.push("/categories")}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRail}
            >
              {dummyCategories.map((category) => (
                <Pressable
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() =>
                    router.push({
                      pathname: "/search-results",
                      params: { q: category.label, filter: "all" },
                    })
                  }
                >
                  <View style={[styles.categoryIconWrap, { backgroundColor: category.accent }]}>
                    <Ionicons name={category.icon as never} size={22} color="#1C2335" />
                  </View>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <SectionHeader
              title="Hot deals"
              action="More"
              onPress={() => router.push("/offers")}
            />
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={promoSnap}
              disableIntervalMomentum
              snapToAlignment="start"
              contentContainerStyle={styles.promoRail}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: promoScrollX } } }],
                { useNativeDriver: false },
              )}
              scrollEventThrottle={16}
            >
              {dummyHomePromos.map((promo, index) => {
                const inputRange = [
                  (index - 1) * promoSnap,
                  index * promoSnap,
                  (index + 1) * promoSnap,
                ];
                const scale = promoScrollX.interpolate({
                  inputRange,
                  outputRange: [0.96, 1, 0.96],
                  extrapolate: "clamp",
                });

                return (
                  <Animated.View
                    key={promo.id}
                    style={[
                      styles.promoCard,
                      {
                        width: promoCardWidth,
                        backgroundColor: promo.bg,
                        transform: [{ scale }],
                      },
                    ]}
                  >
                    <Pressable
                      style={styles.promoPressable}
                      onPress={() =>
                        router.push({
                          pathname: "/offer/[id]",
                          params: { id: promo.id },
                        })
                      }
                    >
                      <View style={[styles.promoGlowLarge, { backgroundColor: promo.glow }]} />
                      <View style={styles.promoGlowSmall} />
                      <Text style={styles.promoTitle}>{promo.title}</Text>
                      <Text style={styles.promoNote}>{promo.note}</Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </Animated.ScrollView>

            <SectionHeader
              title="Featured"
              action="See all"
              onPress={() =>
                router.push({
                  pathname: "/restaurant-collection",
                  params: { mode: "featured" },
                })
              }
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredRail}
            >
              {featuredRestaurants.map(({ restaurant, distanceText }) => (
                <View
                  key={restaurant.id}
                  style={[styles.featuredCard, { width: width * 0.72 }]}
                >
                  <Pressable
                    style={styles.restaurantCardPressable}
                    onPress={() =>
                      router.push({
                        pathname: "/restaurant/[id]",
                        params: { id: restaurant.id },
                      })
                    }
                  >
                    <Image
                      source={{ uri: restaurant.coverImage }}
                      style={styles.featuredImage}
                      contentFit="cover"
                    />
                    <View style={styles.featuredBody}>
                      <View style={styles.featuredTopRow}>
                        <Text style={styles.featuredName}>{restaurant.name}</Text>
                        <View style={styles.ratingPill}>
                          <Ionicons name="star" size={12} color="#F29D18" />
                          <Text style={styles.ratingPillText}>
                            {restaurant.rating.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.featuredMeta}>
                        {restaurant.cuisine} | {restaurant.deliveryTime} | {distanceText}
                      </Text>
                      {restaurant.voucher ? (
                        <View style={styles.homeVoucherPill}>
                          <Ionicons name="ticket-outline" size={11} color="#FF5D8F" />
                          <Text style={styles.homeVoucherText}>{restaurant.voucher}</Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                  <FavoriteButton
                    restaurantId={restaurant.id}
                    style={styles.cardFavoriteButton}
                  />
                </View>
              ))}
            </ScrollView>

            {voucherRestaurants.length > 0 ? (
              <>
                <SectionHeader
                  title="Offers near you"
                  action="See all"
                  onPress={() =>
                    router.push({
                      pathname: "/restaurant-collection",
                      params: { mode: "offers" },
                    })
                  }
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredRail}
                >
                  {voucherRestaurants.map(({ restaurant, distanceText }) => (
                    <View
                      key={restaurant.id}
                      style={[styles.featuredCard, { width: width * 0.72 }]}
                    >
                      <Pressable
                        style={styles.restaurantCardPressable}
                        onPress={() =>
                          router.push({
                            pathname: "/restaurant/[id]",
                            params: { id: restaurant.id },
                          })
                        }
                      >
                        <Image
                          source={{ uri: restaurant.coverImage }}
                          style={styles.featuredImage}
                          contentFit="cover"
                        />
                        <View style={styles.featuredBody}>
                          <View style={styles.featuredTopRow}>
                            <Text style={styles.featuredName}>{restaurant.name}</Text>
                            <View style={styles.ratingPill}>
                              <Ionicons name="star" size={12} color="#F29D18" />
                              <Text style={styles.ratingPillText}>
                                {restaurant.rating.toFixed(1)}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.featuredMeta}>
                            {restaurant.cuisine} | {restaurant.deliveryTime} | {distanceText}
                          </Text>
                          {restaurant.voucher ? (
                            <View style={styles.homeVoucherPill}>
                              <Ionicons name="ticket-outline" size={11} color="#FF5D8F" />
                              <Text style={styles.homeVoucherText}>{restaurant.voucher}</Text>
                            </View>
                          ) : null}
                        </View>
                      </Pressable>
                      <FavoriteButton
                        restaurantId={restaurant.id}
                        style={styles.cardFavoriteButton}
                      />
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <SectionHeader
              title="Quick delivery"
              action="All restaurants"
              onPress={() => router.push("/(tabs)/discover")}
            />
            <View style={styles.quickDeliveryList}>
              {quickRestaurants.map(({ restaurant, distanceText }) => (
                <View
                  key={restaurant.id}
                  style={[styles.featuredCard, styles.quickFeaturedCard]}
                >
                  <Pressable
                    style={styles.restaurantCardPressable}
                    onPress={() =>
                      router.push({
                        pathname: "/restaurant/[id]",
                        params: { id: restaurant.id },
                      })
                    }
                  >
                    <Image
                      source={{ uri: restaurant.coverImage }}
                      style={styles.featuredImage}
                      contentFit="cover"
                    />
                    <View style={styles.featuredBody}>
                      <View style={styles.featuredTopRow}>
                        <Text style={styles.featuredName}>{restaurant.name}</Text>
                        <View style={styles.ratingPill}>
                          <Ionicons name="star" size={12} color="#F29D18" />
                          <Text style={styles.ratingPillText}>
                            {restaurant.rating.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.featuredMeta}>
                        {restaurant.cuisine} | {distanceText}
                      </Text>
                      <View style={styles.quickCardFooter}>
                        <View style={styles.etaPill}>
                          <Ionicons name="time-outline" size={13} color="#24314A" />
                          <Text style={styles.etaText}>{restaurant.deliveryTime}</Text>
                        </View>
                        <Text style={styles.quickPrice}>From {restaurant.startingPrice}tk</Text>
                      </View>
                    </View>
                  </Pressable>
                  <FavoriteButton
                    restaurantId={restaurant.id}
                    style={styles.cardFavoriteButton}
                  />
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="storefront-outline" size={28} color="#24314A" />
            </View>
            <Text style={styles.emptyStateTitle}>Tumar area te kono restaurants nei</Text>
            <Text style={styles.emptyStateText}>
              Onno location select koro, tahole nearby restaurants dekhte parbe.
            </Text>
            <Pressable style={styles.emptyStateButton} onPress={openSheet}>
              <Text style={styles.emptyStateButtonText}>Change location</Text>
            </Pressable>
          </View>
        )}
      </Animated.ScrollView>

      <Modal
        visible={locationSheetVisible}
        transparent
        animationType="none"
        onRequestClose={() => closeSheet()}
      >
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.backdrop, { opacity: sheetBackdrop }]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => closeSheet()}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Choose location</Text>
            <Text style={styles.sheetSubtitle}>Saved places and map pin.</Text>

            <View style={styles.currentLocationCard}>
              <View style={styles.currentLocationIcon}>
                <Ionicons name="navigate" size={18} color="#20263A" />
              </View>
              <View style={styles.currentLocationCopy}>
                <Text style={styles.currentLocationLabel}>Current</Text>
                <Text style={styles.currentLocationValue}>{selectedLocation.label}</Text>
              </View>
            </View>

            {savedLocations.map((location) => (
              <Pressable
                key={location.id}
                style={styles.sheetOption}
                onPress={() => {
                  setDeliveryLocation(location);
                  closeSheet();
                }}
              >
                <View style={styles.sheetOptionIcon}>
                  <Ionicons
                    name="bookmark-outline"
                    size={18}
                    color="#20263A"
                  />
                </View>
                <View style={styles.sheetOptionCopy}>
                  <Text style={styles.sheetOptionTitle}>{location.name}</Text>
                  <Text style={styles.sheetOptionText}>{location.label}</Text>
                </View>
              </Pressable>
            ))}

            <Pressable
              style={styles.sheetOption}
              onPress={() => closeSheet(() => router.push("/location-picker"))}
            >
              <View style={styles.sheetOptionIcon}>
                <Ionicons name="pin-outline" size={18} color="#20263A" />
              </View>
              <View style={styles.sheetOptionCopy}>
                <Text style={styles.sheetOptionTitle}>Pick on map</Text>
                <Text style={styles.sheetOptionText}>Move pin to exact spot</Text>
              </View>
            </Pressable>

            <Pressable style={styles.doneButton} onPress={() => closeSheet()}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress ? (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : (
        <Text style={styles.sectionAction}>{action}</Text>
      )}
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
  headerCard: {
    backgroundColor: "#FFEEE5",
    borderRadius: 34,
    padding: 18,
    overflow: "hidden",
    marginTop: 4,
  },
  headerBlobOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFD166",
    top: -56,
    right: -44,
    opacity: 0.55,
  },
  headerBlobTwo: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#7BDFF2",
    bottom: -46,
    left: -34,
    opacity: 0.35,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  locationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD166",
  },
  locationTextWrap: {
    flex: 1,
    gap: 2,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#20263A",
  },
  locationSubtitle: {
    fontSize: 12,
    color: "#6F6A77",
  },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5D8F",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD166",
  },
  cartBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#20263A",
  },
  heroTitle: {
    marginTop: 18,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "900",
    color: "#20263A",
    maxWidth: 240,
  },
  quickPickRow: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickPickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  quickPickText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#20263A",
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
  categoryRail: {
    gap: 12,
    paddingRight: 18,
  },
  categoryCard: {
    width: 92,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 24,
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  categoryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#20263A",
    textAlign: "center",
  },
  promoRail: {
    gap: 14,
    paddingRight: 18,
  },
  promoCard: {
    height: 148,
    borderRadius: 30,
    padding: 20,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  promoPressable: {
    flex: 1,
    justifyContent: "flex-end",
  },
  promoGlowLarge: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    top: -48,
    right: -34,
    opacity: 0.9,
  },
  promoGlowSmall: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    left: -20,
    bottom: -16,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  promoTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  promoNote: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.86)",
  },
  featuredRail: {
    gap: 14,
    paddingRight: 18,
  },
  featuredCard: {
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
  featuredImage: {
    width: "100%",
    height: 136,
  },
  restaurantCardPressable: {
    flex: 1,
  },
  cardFavoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  featuredBody: {
    padding: 14,
    gap: 8,
  },
  featuredTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  featuredName: {
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
  featuredMeta: {
    fontSize: 13,
    color: "#7B6F69",
  },
  homeVoucherPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFE8F0",
  },
  homeVoucherText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FF5D8F",
  },
  quickFeaturedCard: {
    borderWidth: 1,
    borderColor: "#F1E6DD",
  },
  quickDeliveryList: {
    gap: 14,
  },
  quickCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  listWrap: {
    gap: 14,
  },
  restaurantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  restaurantThumb: {
    width: 74,
    height: 74,
    borderRadius: 22,
  },
  restaurantBody: {
    flex: 1,
    gap: 10,
  },
  restaurantTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  restaurantCopy: {
    flex: 1,
    gap: 3,
  },
  restaurantName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#20263A",
  },
  restaurantMeta: {
    fontSize: 13,
    color: "#7B6F69",
  },
  etaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#E9EEFF",
  },
  etaText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24314A",
  },
  quickPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#20263A",
  },
  emptyStateCard: {
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingVertical: 30,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  emptyStateIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#20263A",
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#7B6F69",
    textAlign: "center",
  },
  emptyStateButton: {
    marginTop: 4,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5C7CFA",
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  restaurantBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  restaurantPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: "#20263A",
  },
  restaurantRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  restaurantRatingText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6D645F",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 23, 35, 0.36)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E3DBD4",
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#20263A",
  },
  sheetSubtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 14,
    color: "#7B6F69",
  },
  currentLocationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "#FFF3D8",
    marginBottom: 16,
  },
  currentLocationIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD166",
  },
  currentLocationCopy: {
    flex: 1,
    gap: 3,
  },
  currentLocationLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7B6F69",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  currentLocationValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#20263A",
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "#FFF7F2",
    marginBottom: 12,
  },
  sheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9EEFF",
  },
  sheetOptionCopy: {
    flex: 1,
    gap: 3,
  },
  sheetOptionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#20263A",
  },
  sheetOptionText: {
    fontSize: 13,
    color: "#7B6F69",
  },
  doneButton: {
    marginTop: 8,
    minHeight: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5D8F",
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
