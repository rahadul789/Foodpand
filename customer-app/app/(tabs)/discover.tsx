import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CategoryRailSkeleton,
  FilterChipsSkeleton,
} from "@/components/content-skeletons";
import { FavoriteButton } from "@/components/favorite-button";
import { RestaurantCardListSkeleton } from "@/components/restaurant-skeletons";
import { useDiscoverContentQuery } from "@/lib/content-queries";
import {
  dummyCategories,
  dummyDiscoverFilters,
} from "@/lib/customer-data";
import { useDeliveryLocation } from "@/lib/location-store";
import {
  formatDistanceKm,
  getRestaurantDistanceKm,
  type RestaurantBrowseSort,
} from "@/lib/restaurant-utils";
import { useRestaurantsQuery } from "@/lib/restaurant-queries";

const sortOptions: {
  id: RestaurantBrowseSort;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "nearest", label: "Nearest", icon: "navigate-outline" },
  { id: "lowest-price", label: "Lowest price", icon: "pricetag-outline" },
  { id: "highest-rating", label: "Highest rating", icon: "star-outline" },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const deliveryLocation = useDeliveryLocation();
  const { data: discoverContent, isLoading: discoverContentLoading } =
    useDiscoverContentQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([
    "Pizza",
    "Burger",
    "Dessert",
  ]);
  const availableFilters = discoverContent?.filters ?? dummyDiscoverFilters;
  const availableCategories = discoverContent?.categories ?? dummyCategories;
  const [selectedFilter, setSelectedFilter] = useState<"all" | "rating-3" | "rating-4" | "under-30" | "offers">("all");
  const [selectedSort, setSelectedSort] =
    useState<RestaurantBrowseSort>("nearest");
  const [filterVisible, setFilterVisible] = useState(false);
  const { data: restaurantData, isLoading: restaurantsLoading } =
    useRestaurantsQuery({
      lat: deliveryLocation.latitude,
      lng: deliveryLocation.longitude,
      filter: selectedFilter,
      sort: selectedSort,
      limit: 50,
    });

  const trimmedQuery = searchQuery.trim();
  const allRestaurants = useMemo(
    () => restaurantData ?? [],
    [restaurantData],
  );
  const allRestaurantsWithDistance = useMemo(
    () =>
      allRestaurants.map((restaurant) => ({
        restaurant,
        distanceText: formatDistanceKm(
          getRestaurantDistanceKm({
            restaurant,
            latitude: deliveryLocation.latitude,
            longitude: deliveryLocation.longitude,
          }),
        ),
      })),
    [
      allRestaurants,
        deliveryLocation.latitude,
        deliveryLocation.longitude,
      ],
  );

  const pushRecentSearch = (value: string) => {
    const normalized = value.trim();

    if (!normalized) {
      return;
    }

    setRecentSearches((current) =>
      [normalized, ...current.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(
        0,
        3,
      ),
    );
  };

  const openSearchResults = (value?: string) => {
    const query = (value ?? searchQuery).trim();

    if (!query && selectedFilter === "all") {
      return;
    }

    if (query) {
      pushRecentSearch(query);
    }

    router.push({
      pathname: "/search-results",
      params: {
        q: query,
        filter: selectedFilter,
        sort: selectedSort,
      },
    });
  };

  const activeSortLabel =
    sortOptions.find((item) => item.id === selectedSort)?.label ?? "Nearest";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBubbleOne} />
          <View style={styles.heroBubbleTwo} />

          <View style={styles.heroTopRow}>
            <Text style={styles.heroTitle}>Discover</Text>
            <Pressable
              style={styles.filterButton}
              onPress={() => setFilterVisible(true)}
            >
              <Ionicons name="options-outline" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.searchShell}>
            <Ionicons name="search-outline" size={18} color="#8D8178" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Pizza, burger, dessert..."
              placeholderTextColor="#9D9188"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => openSearchResults()}
            />
            {trimmedQuery ? (
              <Pressable
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery("")}
              >
                <Ionicons name="close" size={16} color="#8D8178" />
              </Pressable>
            ) : null}
          </View>

          {discoverContentLoading ? (
            <View style={styles.filterSkeletonWrap}>
              <FilterChipsSkeleton />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {availableFilters.map((filter) => {
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
          )}
          <View style={styles.sortPreviewRow}>
            <Text style={styles.sortPreviewLabel}>Sort</Text>
            <View style={styles.sortPreviewPill}>
              <Ionicons name="swap-vertical-outline" size={13} color="#24314A" />
              <Text style={styles.sortPreviewText}>{activeSortLabel}</Text>
            </View>
          </View>
        </View>

        <SectionHeader
          title="Popular categories"
          action="See all"
          onPress={() => router.push("/categories")}
        />
        {discoverContentLoading ? (
          <CategoryRailSkeleton />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRail}
          >
            {availableCategories.map((category) => (
              <Pressable
                key={category.id}
                style={styles.categoryCard}
                onPress={() => {
                  setSearchQuery(category.label);
                  openSearchResults(category.label);
                }}
              >
                <View
                  style={[
                    styles.categoryIconWrap,
                    { backgroundColor: category.accent },
                  ]}
                >
                  <Ionicons
                    name={category.icon as never}
                    size={20}
                    color="#20263A"
                  />
                </View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.discoveryIntro}>
          <SectionHeader
            title="All restaurants"
            action={`${allRestaurantsWithDistance.length}`}
          />
          {restaurantsLoading ? (
            <RestaurantCardListSkeleton count={4} />
          ) : (
            <View style={styles.nearbyList}>
              {allRestaurantsWithDistance.map(({ restaurant, distanceText }) => (
                <View
                  key={restaurant.id}
                  style={styles.nearbyCard}
                >
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
                      style={styles.nearbyImage}
                      contentFit="cover"
                    />
                    <View style={styles.nearbyBody}>
                      <View style={styles.nearbyTop}>
                        <Text style={styles.nearbyName}>{restaurant.name}</Text>
                        <View style={styles.nearbyRating}>
                          <Ionicons name="star" size={11} color="#F29D18" />
                          <Text style={styles.nearbyRatingText}>
                            {restaurant.rating.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.nearbyMeta}>
                        {restaurant.cuisine} | {restaurant.deliveryTime}
                      </Text>
                      <View style={styles.nearbyBottom}>
                        <Text style={styles.nearbyDistance}>{distanceText}</Text>
                        {restaurant.voucher ? (
                          <View style={styles.voucherPill}>
                            <Ionicons name="ticket-outline" size={11} color="#FF5D8F" />
                            <Text style={styles.voucherText}>{restaurant.voucher}</Text>
                          </View>
                        ) : restaurant.featured ? (
                          <View style={styles.featuredPill}>
                            <Ionicons name="sparkles-outline" size={11} color="#5C7CFA" />
                            <Text style={styles.featuredText}>Featured</Text>
                          </View>
                        ) : null}
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

          <SectionHeader title="Recent search" action={`${recentSearches.length}`} />
          <View style={styles.recentList}>
            {recentSearches.map((item) => (
              <Pressable
                key={item}
                style={styles.recentCard}
                onPress={() => {
                  setSearchQuery(item);
                  openSearchResults(item);
                }}
              >
                <View style={styles.recentIcon}>
                  <Ionicons name="time-outline" size={16} color="#24314A" />
                </View>
                <Text style={styles.recentText}>{item}</Text>
                <Ionicons name="arrow-up-outline" size={15} color="#8A7E75" />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setFilterVisible(false)}
          />
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filter discover</Text>
            <View style={styles.sheetOptions}>
              {availableFilters.map((filter) => {
                const active = selectedFilter === filter.id;

                return (
                  <Pressable
                    key={filter.id}
                    style={[
                      styles.sheetOption,
                      { backgroundColor: active ? "#24314A" : filter.color },
                    ]}
                    onPress={() => {
                      setSelectedFilter(filter.id);
                      setFilterVisible(false);
                    }}
                  >
                    <Ionicons
                      name={filter.icon as never}
                      size={16}
                      color={active ? "#FFFFFF" : "#24314A"}
                    />
                    <Text
                      style={[
                        styles.sheetOptionText,
                        { color: active ? "#FFFFFF" : "#24314A" },
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.sheetSubTitle}>Sort restaurants</Text>
            <View style={styles.sheetOptions}>
              {sortOptions.map((sortOption) => {
                const active = selectedSort === sortOption.id;

                return (
                  <Pressable
                    key={sortOption.id}
                    style={[
                      styles.sheetOption,
                      { backgroundColor: active ? "#24314A" : "#F4F0EB" },
                    ]}
                    onPress={() => {
                      setSelectedSort(sortOption.id);
                      setFilterVisible(false);
                    }}
                  >
                    <Ionicons
                      name={sortOption.icon}
                      size={16}
                      color={active ? "#FFFFFF" : "#24314A"}
                    />
                    <Text
                      style={[
                        styles.sheetOptionText,
                        { color: active ? "#FFFFFF" : "#24314A" },
                      ]}
                    >
                      {sortOption.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              style={styles.clearButton}
              onPress={() => {
                setSelectedFilter("all");
                setSelectedSort("nearest");
                setFilterVisible(false);
              }}
            >
              <Text style={styles.clearButtonText}>Reset</Text>
            </Pressable>
          </View>
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
  heroCard: {
    backgroundColor: "#E8EDFF",
    borderRadius: 34,
    padding: 18,
    overflow: "hidden",
    marginTop: 4,
  },
  heroBubbleOne: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#7BDFF2",
    opacity: 0.34,
    top: -52,
    right: -42,
  },
  heroBubbleTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#FFD166",
    opacity: 0.4,
    bottom: -36,
    left: -30,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#20263A",
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5C7CFA",
  },
  searchShell: {
    marginTop: 14,
    minHeight: 56,
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#20263A",
  },
  clearSearchButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F1EC",
  },
  filterRow: {
    marginTop: 14,
    gap: 10,
    paddingRight: 10,
  },
  filterSkeletonWrap: {
    marginTop: 14,
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
  sortPreviewRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sortPreviewLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6F6A77",
  },
  sortPreviewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  sortPreviewText: {
    fontSize: 12,
    fontWeight: "800",
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
    width: 54,
    height: 54,
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
  discoveryIntro: {
    gap: 14,
  },
  nearbyList: {
    gap: 12,
  },
  nearbyCard: {
    position: "relative",
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  nearbyImage: {
    width: 88,
    height: 88,
    borderRadius: 18,
  },
  restaurantPressable: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  nearbyBody: {
    flex: 1,
    gap: 6,
    paddingRight: 50,
  },
  nearbyTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  nearbyName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: "#20263A",
  },
  nearbyRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#FFF1CC",
    flexShrink: 0,
  },
  nearbyRatingText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9B6500",
  },
  nearbyMeta: {
    fontSize: 12,
    color: "#7B6F69",
  },
  nearbyBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  nearbyDistance: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6F6A77",
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
  featuredPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E8EDFF",
  },
  featuredText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#5C7CFA",
  },
  recentList: {
    gap: 12,
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  recentIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  recentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#20263A",
  },
  restaurantRail: {
    gap: 14,
    paddingRight: 18,
  },
  restaurantCard: {
    width: 250,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  restaurantImage: {
    width: "100%",
    height: 150,
  },
  restaurantBody: {
    padding: 14,
    gap: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#20263A",
  },
  restaurantMeta: {
    fontSize: 13,
    color: "#7B6F69",
  },
  restaurantFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  restaurantPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24314A",
  },
  menuList: {
    gap: 12,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  menuCopy: {
    flex: 1,
    gap: 4,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#20263A",
  },
  menuDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: "#7B6F69",
  },
  menuPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#20263A",
  },
  emptyState: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 26,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#20263A",
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#7B6F69",
    textAlign: "center",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 23, 35, 0.32)",
  },
  filterSheet: {
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
  sheetSubTitle: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: "900",
    color: "#20263A",
  },
  sheetOptions: {
    marginTop: 18,
    gap: 12,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
  },
  sheetOptionText: {
    fontSize: 14,
    fontWeight: "800",
  },
  clearButton: {
    marginTop: 16,
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F0EB",
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#24314A",
  },
});
