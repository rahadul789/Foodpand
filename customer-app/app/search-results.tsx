import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDeferredValue, useMemo, useState } from "react";
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

import { FavoriteButton } from "@/components/favorite-button";
import {
  dummyDiscoverFilters,
  dummyRestaurants,
} from "@/lib/customer-data";
import { useDeliveryLocation } from "@/lib/location-store";
import {
  formatDistanceKm,
  applyRestaurantBrowse,
  getNearbyRestaurants,
  getRestaurantDistanceKm,
  type RestaurantBrowseSort,
} from "@/lib/restaurant-utils";

const sortOptions: {
  id: RestaurantBrowseSort;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "nearest", label: "Nearest", icon: "navigate-outline" },
  { id: "lowest-price", label: "Lowest price", icon: "pricetag-outline" },
  { id: "highest-rating", label: "Highest rating", icon: "star-outline" },
];

export default function SearchResultsScreen() {
  const router = useRouter();
  const deliveryLocation = useDeliveryLocation();
  const params = useLocalSearchParams<{ q?: string; filter?: string; sort?: string }>();
  const [searchQuery, setSearchQuery] = useState(params.q ?? "");
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<
    (typeof dummyDiscoverFilters)[number]["id"]
  >(
    dummyDiscoverFilters.some((item) => item.id === params.filter)
      ? (params.filter as (typeof dummyDiscoverFilters)[number]["id"])
      : "all",
  );
  const [selectedSort, setSelectedSort] = useState<RestaurantBrowseSort>(
    sortOptions.some((item) => item.id === params.sort)
      ? (params.sort as RestaurantBrowseSort)
      : "nearest",
  );

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const trimmedQuery = deferredSearchQuery.trim();

  const filteredRestaurants = useMemo(() => {
    const query = trimmedQuery.toLowerCase();
    const sortedRestaurants = applyRestaurantBrowse({
      restaurants: dummyRestaurants,
      latitude: deliveryLocation.latitude,
      longitude: deliveryLocation.longitude,
      filter: selectedFilter,
      sort: selectedSort,
    });
    const shouldLimitToNearby =
      query.length === 0 &&
      selectedFilter === "all" &&
      selectedSort === "nearest";
    const sourceRestaurants =
      shouldLimitToNearby
        ? getNearbyRestaurants({
            restaurants: sortedRestaurants,
            latitude: deliveryLocation.latitude,
            longitude: deliveryLocation.longitude,
            radiusKm: 3,
          })
        : sortedRestaurants;

    return sourceRestaurants
      .filter((restaurant) => {
        const matchesQuery =
          query.length === 0 ||
          `${restaurant.name} ${restaurant.cuisine} ${restaurant.tags.join(" ")} ${restaurant.menu
            .map((item) => `${item.name} ${item.category ?? ""}`)
            .join(" ")}`
            .toLowerCase()
            .includes(query);
        return matchesQuery;
      })
      .map((restaurant) => ({
        restaurant,
        distanceText: formatDistanceKm(
          getRestaurantDistanceKm({
            restaurant,
            latitude: deliveryLocation.latitude,
            longitude: deliveryLocation.longitude,
          }),
        ),
      }));
  }, [
    deliveryLocation.latitude,
    deliveryLocation.longitude,
    selectedFilter,
    selectedSort,
    trimmedQuery,
  ]);

  const totalResults = filteredRestaurants.length;
  const activeFilterLabel =
    dummyDiscoverFilters.find((item) => item.id === selectedFilter)?.label ?? "All";
  const activeSortLabel =
    sortOptions.find((item) => item.id === selectedSort)?.label ?? "Nearest";
  const summaryTitle = trimmedQuery
    ? `Results for "${trimmedQuery}"`
    : selectedFilter === "all" && selectedSort === "nearest"
      ? "Restaurants near you"
      : "Restaurants";

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
          <Text style={styles.topTitle}>Search result</Text>
          <Pressable
            style={styles.filterActionButton}
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchShell}>
            <Ionicons name="search-outline" size={18} color="#8D8178" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Pizza, burger, dessert..."
              placeholderTextColor="#9D9188"
              style={styles.searchInput}
              returnKeyType="search"
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
          <View style={styles.activeFilterRow}>
            <Text style={styles.activeFilterLabel}>Filter & sort</Text>
            <View style={styles.activeFilterSummary}>
              <View style={styles.activeFilterPill}>
                <Ionicons name="options-outline" size={13} color="#24314A" />
                <Text style={styles.activeFilterText}>{activeFilterLabel}</Text>
              </View>
              <View style={styles.activeFilterPill}>
                <Ionicons name="swap-vertical-outline" size={13} color="#24314A" />
                <Text style={styles.activeFilterText}>{activeSortLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryTitle}>{summaryTitle}</Text>
          <Text style={styles.summaryCount}>{totalResults}</Text>
        </View>

        {totalResults === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={26} color="#24314A" />
            </View>
            <Text style={styles.emptyTitle}>No item found</Text>
            <Text style={styles.emptyText}>
              Try another food name, category, or restaurant.
            </Text>
          </View>
        ) : (
          <>
            {filteredRestaurants.length > 0 ? (
              <>
                <SectionHeader
                  title="Restaurants"
                  action={`${filteredRestaurants.length}`}
                />
                <View style={styles.restaurantList}>
                  {filteredRestaurants.map(({ restaurant, distanceText }) => (
                    <View
                      key={restaurant.id}
                      style={styles.restaurantCard}
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
                          style={styles.restaurantImage}
                          contentFit="cover"
                        />
                        <View style={styles.restaurantBody}>
                          <View style={styles.restaurantTitleRow}>
                            <Text style={styles.restaurantName}>{restaurant.name}</Text>
                            <View style={styles.ratingPill}>
                              <Ionicons name="star" size={12} color="#F29D18" />
                              <Text style={styles.ratingPillText}>
                                {restaurant.rating.toFixed(1)}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.restaurantMeta}>
                            {restaurant.cuisine} | {restaurant.deliveryTime}
                          </Text>
                          <View style={styles.restaurantFooter}>
                            <Text style={styles.restaurantDistance}>{distanceText}</Text>
                            <View style={styles.restaurantRightMeta}>
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
              </>
            ) : null}
          </>
        )}
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
            <Text style={styles.sheetTitle}>Filter search result</Text>
            <View style={styles.sheetOptions}>
              {dummyDiscoverFilters.map((filter) => {
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
}: {
  title: string;
  action: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionAction}>{action}</Text>
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
    paddingBottom: 42,
    gap: 20,
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
  filterActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5C7CFA",
    shadowColor: "#5C7CFA",
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#20263A",
  },
  searchCard: {
    borderRadius: 30,
    padding: 16,
    backgroundColor: "#E8EDFF",
    gap: 12,
  },
  searchShell: {
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
  activeFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  activeFilterSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    flex: 1,
  },
  activeFilterLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6F6A77",
  },
  activeFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24314A",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    color: "#20263A",
  },
  summaryCount: {
    minWidth: 36,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "800",
    color: "#8A7E75",
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
  restaurantList: {
    gap: 14,
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
  restaurantImage: {
    width: "100%",
    height: 176,
  },
  restaurantPressable: {
    flex: 1,
  },
  favoriteButton: {
    position: "absolute",
    top: 14,
    right: 14,
  },
  restaurantBody: {
    padding: 14,
    gap: 8,
  },
  restaurantTitleRow: {
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
  restaurantMeta: {
    fontSize: 13,
    color: "#7B6F69",
  },
  restaurantFooter: {
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
  restaurantRightMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
