import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  type MenuItem,
  type MenuItemAddonGroup,
  type MenuItemBundleSuggestion,
  type MenuItemOptionGroup,
  dummyRestaurants,
} from "@/lib/customer-data";
import { getCartBreakdown, getCartCount, getCartSubtotalTk, useCartStore } from "@/lib/cart-store";
import { useFavoriteStore } from "@/lib/favorite-store";
import { useDeliveryLocation } from "@/lib/location-store";
import { formatDistanceKm, getRestaurantDistanceKm } from "@/lib/restaurant-utils";
import { useUIStore } from "@/lib/ui-store";

const tk = (price: number) => Math.round(price * 10);

type OptionSelections = Record<string, string>;
type AddonSelections = Record<string, string[]>;

function requiresDetailSheet(item: MenuItem) {
  return Boolean(
    item.optionGroups?.length ||
      item.detail?.addonGroups?.length ||
      item.detail?.bundleSuggestions?.length ||
      item.detail?.instructionsPlaceholder,
  );
}

function getOptionSummary(
  groups: MenuItemOptionGroup[] | undefined,
  picks: OptionSelections,
) {
  if (!groups?.length) return [];

  return groups
    .map((group) => group.choices.find((choice) => choice.id === picks[group.id])?.label)
    .filter((value): value is string => Boolean(value));
}

function getAddonSummary(
  groups: MenuItemAddonGroup[] | undefined,
  picks: AddonSelections,
) {
  if (!groups?.length) return [];

  return groups.flatMap((group) =>
    group.items
      .filter((item) => (picks[group.id] ?? []).includes(item.id))
      .map((item) => item.label),
  );
}

function getBundleSummary(
  suggestions: MenuItemBundleSuggestion[] | undefined,
  picks: string[],
) {
  if (!suggestions?.length) return [];

  return suggestions
    .filter((item) => picks.includes(item.id))
    .map((item) => item.label);
}

function getConfiguredUnitTk(
  item: MenuItem,
  optionPicks: OptionSelections,
  addonPicks: AddonSelections,
  bundlePicks: string[],
) {
  const optionExtra =
    item.optionGroups?.reduce((sum, group) => {
      const choice = group.choices.find((entry) => entry.id === optionPicks[group.id]);
      return sum + (choice?.priceModifier ?? 0);
    }, 0) ?? 0;

  const addonExtra =
    item.detail?.addonGroups?.reduce((sum, group) => {
      const selected = addonPicks[group.id] ?? [];
      return (
        sum +
        group.items.reduce(
          (groupSum, addon) =>
            groupSum + (selected.includes(addon.id) ? addon.priceModifier : 0),
          0,
        )
      );
    }, 0) ?? 0;

  const bundleExtra =
    item.detail?.bundleSuggestions?.reduce(
      (sum, suggestion) =>
        sum + (bundlePicks.includes(suggestion.id) ? suggestion.priceModifier : 0),
      0,
    ) ?? 0;

  return tk(item.price + optionExtra + addonExtra + bundleExtra);
}

function buildItemSummary(
  item: MenuItem,
  optionPicks: OptionSelections,
  addonPicks: AddonSelections,
  bundlePicks: string[],
  note: string,
) {
  const parts = [
    ...getOptionSummary(item.optionGroups, optionPicks),
    ...getAddonSummary(item.detail?.addonGroups, addonPicks),
    ...getBundleSummary(item.detail?.bundleSuggestions, bundlePicks),
  ];

  if (note.trim()) {
    parts.push("Note added");
  }

  return parts.join(" | ");
}

function buildCartKey(
  item: MenuItem,
  optionPicks: OptionSelections,
  addonPicks: AddonSelections,
  bundlePicks: string[],
  note: string,
) {
  const optionKey = Object.entries(optionPicks)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join(",");

  const addonKey = Object.entries(addonPicks)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${[...value].sort().join("+")}`)
    .join(",");

  const bundleKey = [...bundlePicks].sort().join("+");
  const noteKey = note.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 120);

  return [item.id, optionKey, addonKey, bundleKey, noteKey]
    .filter(Boolean)
    .join("|");
}

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const restaurant = dummyRestaurants.find((item) => item.id === id) ?? dummyRestaurants[0];
  const deliveryLocation = useDeliveryLocation();
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Popular");
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [sheetChoices, setSheetChoices] = useState<OptionSelections>({});
  const [sheetAddons, setSheetAddons] = useState<AddonSelections>({});
  const [sheetBundles, setSheetBundles] = useState<string[]>([]);
  const [sheetNote, setSheetNote] = useState("");
  const [sheetQty, setSheetQty] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const cart = useCartStore((state) => state.items);
  const couponDiscountTk = useCartStore((state) => state.couponDiscountTk);
  const addItem = useCartStore((state) => state.addItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const favorite = useFavoriteStore((state) =>
    state.favoriteIds.includes(restaurant.id),
  );
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const showToast = useUIStore((state) => state.showToast);
  const cartEntries = useMemo(() => Object.values(cart), [cart]);
  const itemQuantities = useMemo(
    () =>
      cartEntries.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.itemId] = (acc[entry.itemId] ?? 0) + entry.quantity;
        return acc;
      }, {}),
    [cartEntries],
  );
  const itemSummaries = useMemo(
    () =>
      cartEntries.reduce<Record<string, string>>((acc, entry) => {
        if (!acc[entry.itemId]) {
          acc[entry.itemId] = entry.summary ?? "";
        }
        return acc;
      }, {}),
    [cartEntries],
  );

  const tabs = useMemo(() => {
    const categories = Array.from(
      new Set(restaurant.menu.map((item) => item.category).filter((v): v is string => Boolean(v))),
    );
    return ["Popular", ...categories.filter((v) => v !== "Popular")];
  }, [restaurant.menu]);

  const sections = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return tabs
      .map((title) => ({
        title,
        items: restaurant.menu.filter((item) => {
          const matchesQuery = !q || `${item.name} ${item.description}`.toLowerCase().includes(q);
          const matchesSection = title === "Popular" ? Boolean(item.popular) : (item.category ?? "Popular") === title;
          return matchesQuery && matchesSection;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [deferredQuery, restaurant.menu, tabs]);
  const distanceText = useMemo(
    () =>
      formatDistanceKm(
        getRestaurantDistanceKm({
          restaurant,
          latitude: deliveryLocation.latitude,
          longitude: deliveryLocation.longitude,
        }),
      ),
    [deliveryLocation.latitude, deliveryLocation.longitude, restaurant],
  );

  const cartCount = getCartCount(cart);
  const cartTotal = getCartSubtotalTk(cart);
  const breakdown = getCartBreakdown({
    items: cart,
    couponDiscountTk,
    thresholdOffer: restaurant.thresholdOffer ?? null,
  });
  const thresholdProgress = Math.min(
    breakdown.thresholdEnabled && breakdown.thresholdTargetTk > 0
      ? breakdown.subtotalTk / breakdown.thresholdTargetTk
      : 0,
    1,
  );
  const sheetUnitTk = sheetItem
    ? getConfiguredUnitTk(sheetItem, sheetChoices, sheetAddons, sheetBundles)
    : 0;
  const noteLimit = sheetItem?.detail?.maxInstructionsLength ?? 250;

  const addPlain = (item: MenuItem) =>
    addItem({
      restaurant,
      item,
      unitTk: tk(item.price),
    });

  const decrementMenuItem = (itemId: string) => {
    const matches = cartEntries.filter((entry) => entry.itemId === itemId);
    const target =
      matches.find((entry) => entry.cartKey === itemId) ??
      matches[matches.length - 1];
    if (target) {
      decrementItem(target.cartKey);
    }
  };

  const openItemSheet = (item: MenuItem) => {
    if (!requiresDetailSheet(item)) return;
    setSheetItem(item);
    setSheetChoices(
      Object.fromEntries(
        (item.optionGroups ?? []).map((group) => [group.id, group.choices[0]?.id ?? ""]),
      ),
    );
    setSheetAddons(
      Object.fromEntries((item.detail?.addonGroups ?? []).map((group) => [group.id, []])),
    );
    setSheetBundles([]);
    setSheetNote("");
    setSheetQty(1);
  };

  const addConfigured = () => {
    if (!sheetItem) return;
    const summary = buildItemSummary(
      sheetItem,
      sheetChoices,
      sheetAddons,
      sheetBundles,
      sheetNote,
    );
    const ok = addItem({
      restaurant,
      item: sheetItem,
      quantity: sheetQty,
      unitTk: sheetUnitTk,
      summary,
      cartKey: buildCartKey(
        sheetItem,
        sheetChoices,
        sheetAddons,
        sheetBundles,
        sheetNote,
      ),
    });
    if (ok) {
      setSheetItem(null);
      setSheetNote("");
    }
  };

  const toggleAddon = (group: MenuItemAddonGroup, addonId: string) => {
    setSheetAddons((current) => {
      const selected = current[group.id] ?? [];

      if (selected.includes(addonId)) {
        return {
          ...current,
          [group.id]: selected.filter((value) => value !== addonId),
        };
      }

      if (group.maxSelect && selected.length >= group.maxSelect) {
        showToast(`Select up to ${group.maxSelect} items in ${group.title}.`);
        return current;
      }

      return {
        ...current,
        [group.id]: [...selected, addonId],
      };
    });
  };

  const toggleBundle = (bundleId: string) => {
    setSheetBundles((current) =>
      current.includes(bundleId)
        ? current.filter((value) => value !== bundleId)
        : [...current, bundleId],
    );
  };

  const goToSection = (title: string) => {
    setActiveTab(title);
    scrollRef.current?.scrollTo({ y: Math.max((sectionY.current[title] ?? 0) - 120, 0), animated: true });
  };

  const onScroll = (y: number) => {
    const pointer = y + 150;
    let current = sections[0]?.title ?? "Popular";
    sections.forEach((section) => {
      if (pointer >= (sectionY.current[section.title] ?? 0)) current = section.title;
    });
    if (current !== activeTab) setActiveTab(current);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, cartCount > 0 && styles.contentCart]}
        stickyHeaderIndices={[3]}
        onScroll={(e) => onScroll(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        <View style={styles.top}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#20263A" />
          </Pressable>
          <View style={styles.topRight}>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="information-circle-outline" size={20} color="#20263A" />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => toggleFavorite(restaurant.id)}
            >
              <Ionicons name={favorite ? "heart" : "heart-outline"} size={20} color={favorite ? "#FF5D8F" : "#20263A"} />
            </Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <Image source={{ uri: restaurant.coverImage }} style={styles.heroImg} contentFit="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.logo}>
            <Ionicons name={restaurant.icon as never} size={24} color="#20263A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{restaurant.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.ratePill}>
                <Ionicons name="star" size={12} color="#F29D18" />
                <Text style={styles.rateText}>{restaurant.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.metaText}>{distanceText}</Text>
              <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
            </View>
          </View>
        </View>

        <View style={styles.offer}>
          <View style={styles.offerIcon}>
            <Ionicons name="pricetag" size={16} color="#FF5D8F" />
          </View>
          <View style={styles.offerCopy}>
            <Text style={styles.offerTitle}>50% off (YUMMELA)</Text>
            <Text style={styles.offerText}>Min. order TK 199 for all items. Use in cart.</Text>
          </View>
        </View>

        <View style={styles.stickyWrap}>
          <View style={styles.search}>
            <Ionicons name="search-outline" size={18} color="#8D8178" />
            <TextInput value={query} onChangeText={setQuery} placeholder="Search menu..." placeholderTextColor="#9D9188" style={styles.searchInput} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {tabs.map((tab) => (
              <Pressable key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => goToSection(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {sections.map((section) => (
          <View
            key={section.title}
            style={styles.section}
            onLayout={(e) => {
              sectionY.current[section.title] = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHead}>
              {section.title === "Popular" ? (
                <>
                  <View style={styles.row}>
                    <Ionicons name="flame" size={16} color="#FF7A59" />
                    <Text style={styles.sectionTitle}>Popular</Text>
                  </View>
                  <Text style={styles.sectionSub}>Most ordered right now</Text>
                </>
              ) : (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
            </View>

            <View style={section.title === "Popular" ? styles.grid : styles.list}>
              {section.items.map((item) => {
                const qty = itemQuantities[item.id] ?? 0;
                const canOpenSheet = requiresDetailSheet(item);
                const summaryText =
                  qty > 0
                    ? itemSummaries[item.id]
                      ? `${qty} in cart | ${itemSummaries[item.id]}`
                      : `${qty} in cart`
                    : item.optionGroups?.length
                      ? "Sizes and crust available"
                      : "";

                if (section.title === "Popular") {
                  return (
                    <View key={item.id} style={styles.popularCard}>
                      <Pressable
                        style={styles.popularInfo}
                        disabled={!canOpenSheet}
                        onPress={() => openItemSheet(item)}
                      >
                        <View style={[styles.popularArt, { backgroundColor: item.accent }]}>
                          {item.detail?.image ? (
                            <Image
                              source={{ uri: item.detail.image }}
                              style={styles.popularArtImage}
                              contentFit="cover"
                            />
                          ) : (
                            <Ionicons name={item.icon as never} size={34} color="#20263A" />
                          )}
                        </View>
                        <Text style={styles.popularName}>{item.name}</Text>
                        <Text style={styles.popularPrice}>
                          {canOpenSheet ? `From TK ${tk(item.price)}` : `TK ${tk(item.price)}`}
                        </Text>
                        {summaryText ? (
                          <Text numberOfLines={2} style={styles.cardHint}>
                            {summaryText}
                          </Text>
                        ) : null}
                      </Pressable>
                      {qty === 0 ? (
                        <Pressable
                          style={styles.singleAdd}
                          onPress={() => (canOpenSheet ? openItemSheet(item) : addPlain(item))}
                        >
                          <Ionicons name="add" size={14} color="#FFB100" />
                        </Pressable>
                      ) : (
                        <View style={styles.counter}>
                          <Pressable
                            style={styles.counterBtn}
                            onPress={() => decrementMenuItem(item.id)}
                          >
                            <Ionicons name={qty === 1 ? "trash-outline" : "remove"} size={13} color="#6F6A77" />
                          </Pressable>
                          <Text style={styles.counterText}>{qty}</Text>
                          <Pressable
                            style={[styles.counterBtn, styles.counterBtnActive]}
                            onPress={() => (canOpenSheet ? openItemSheet(item) : addPlain(item))}
                          >
                            <Ionicons name="add" size={13} color="#FFB100" />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                }

                return (
                  <View key={item.id} style={styles.card}>
                    <Pressable
                      style={styles.cardCopy}
                      disabled={!canOpenSheet}
                      onPress={() => openItemSheet(item)}
                    >
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardPrice}>
                        {canOpenSheet ? `From TK ${tk(item.price)}` : `TK ${tk(item.price)}`}
                      </Text>
                      <Text style={styles.cardDesc}>{item.description}</Text>
                      {summaryText ? <Text style={styles.optionText}>{summaryText}</Text> : null}
                      {item.popular ? (
                        <View style={styles.row}>
                          <Ionicons name="flame" size={12} color="#FF7A59" />
                          <Text style={styles.optionText}>Popular</Text>
                        </View>
                      ) : null}
                    </Pressable>
                    <View style={styles.cardAction}>
                      <View style={[styles.cardArt, { backgroundColor: item.accent }]}>
                        {item.detail?.image ? (
                          <Image
                            source={{ uri: item.detail.image }}
                            style={styles.cardArtImage}
                            contentFit="cover"
                          />
                        ) : (
                          <Ionicons name={item.icon as never} size={28} color="#20263A" />
                        )}
                      </View>
                      {qty === 0 ? (
                        <Pressable
                          style={styles.singleAdd}
                          onPress={() => (canOpenSheet ? openItemSheet(item) : addPlain(item))}
                        >
                          <Ionicons name="add" size={15} color="#FFB100" />
                        </Pressable>
                      ) : (
                        <View style={styles.qtyBar}>
                          <Pressable
                            style={styles.counterBtn}
                            onPress={() => decrementMenuItem(item.id)}
                          >
                            <Ionicons name={qty === 1 ? "trash-outline" : "remove"} size={14} color="#6F6A77" />
                          </Pressable>
                          <Text style={styles.counterText}>{qty}</Text>
                          <Pressable
                            style={[styles.counterBtn, styles.counterBtnActive]}
                            onPress={() => (canOpenSheet ? openItemSheet(item) : addPlain(item))}
                          >
                            <Ionicons name="add" size={14} color="#FFB100" />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {cartCount > 0 ? (
        <View style={styles.cartWrap}>
          {breakdown.thresholdEnabled ? (
            <View style={styles.cartNote}>
              <View style={styles.cartNoteTop}>
                <View style={styles.row}>
                  <Ionicons
                    name={breakdown.thresholdReached ? "gift-outline" : "pricetag-outline"}
                    size={14}
                    color={breakdown.thresholdReached ? "#1F9D57" : "#FF5D8F"}
                  />
                  <Text style={styles.cartNoteText}>
                    {couponDiscountTk > 0
                      ? "Coupon active. Restaurant offer is paused."
                      : breakdown.thresholdReached
                        ? `Restaurant offer unlocked. TK ${breakdown.thresholdDiscountValueTk} off added.`
                        : `Add TK ${breakdown.thresholdRemainingTk} more to unlock TK ${breakdown.thresholdDiscountValueTk} off.`}
                  </Text>
                </View>
                <Text style={styles.cartNoteMeta}>
                  TK {breakdown.subtotalTk}/{breakdown.thresholdTargetTk}
                </Text>
              </View>
              <View style={styles.cartProgressTrack}>
                <View
                  style={[
                      styles.cartProgressFill,
                      {
                        width: `${thresholdProgress * 100}%`,
                        backgroundColor:
                          couponDiscountTk > 0
                            ? "#8AA0FF"
                            : breakdown.thresholdReached
                              ? "#2FBF71"
                              : "#FFB100",
                      },
                    ]}
                  />
              </View>
            </View>
          ) : null}
          <Pressable style={styles.cartBar} onPress={() => router.push("/cart")}>
            <View style={styles.cartCount}><Text style={styles.cartCountText}>{cartCount}</Text></View>
            <View style={styles.cartCopy}>
              <Text style={styles.cartTitle}>View your cart</Text>
              <Text style={styles.cartSub}>{restaurant.name}</Text>
            </View>
            <View style={styles.cartAmountPill}>
              <Text style={styles.cartTotal}>TK {cartTotal}</Text>
            </View>
          </Pressable>
        </View>
      ) : null}

      <Modal
        visible={Boolean(sheetItem)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSheetItem(null);
          setSheetNote("");
        }}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setSheetItem(null);
              setSheetNote("");
            }}
          />
          <View style={styles.sheet}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.sheetScroll}
            >
              <View style={styles.sheetHero}>
                <Image
                  source={{ uri: sheetItem?.detail?.image ?? restaurant.coverImage }}
                  style={styles.sheetHeroImage}
                  contentFit="cover"
                />
                <View style={styles.sheetHeroOverlay} />
                <Pressable
                  style={styles.sheetClose}
                  onPress={() => {
                    setSheetItem(null);
                    setSheetNote("");
                  }}
                >
                  <Ionicons name="close" size={18} color="#20263A" />
                </Pressable>
              </View>

              <View style={styles.sheetBody}>
                <Text style={styles.sheetTitle}>{sheetItem?.name}</Text>
                <Text style={styles.sheetPrice}>
                  From TK {sheetItem ? tk(sheetItem.price) : 0}
                </Text>
                {sheetItem?.detail?.subtitle ? (
                  <Text style={styles.sheetSubtitle}>{sheetItem.detail.subtitle}</Text>
                ) : null}
                {sheetItem?.description ? (
                  <Text style={styles.sheetDescription}>{sheetItem.description}</Text>
                ) : null}
              </View>

              {sheetItem?.optionGroups?.map((group) => (
                <View key={group.id} style={styles.detailSection}>
                  <View style={styles.detailSectionTop}>
                    <Text style={styles.detailSectionTitle}>{group.title}</Text>
                    {group.required ? <Text style={styles.mutedPill}>Required</Text> : null}
                  </View>
                  <View style={styles.optionList}>
                    {group.choices.map((choice) => {
                      const active = sheetChoices[group.id] === choice.id;
                      return (
                        <Pressable
                          key={choice.id}
                          style={[styles.optionRow, active && styles.optionRowActive]}
                          onPress={() =>
                            setSheetChoices((current) => ({
                              ...current,
                              [group.id]: choice.id,
                            }))
                          }
                        >
                          <View style={styles.optionRowCopy}>
                            <Text
                              style={[
                                styles.optionRowLabel,
                                active && styles.optionRowLabelActive,
                              ]}
                            >
                              {choice.label}
                            </Text>
                            {choice.priceModifier ? (
                              <Text style={styles.optionRowMeta}>
                                + TK {tk(choice.priceModifier)}
                              </Text>
                            ) : null}
                          </View>
                          <View style={[styles.radioDot, active && styles.radioDotActive]}>
                            {active ? <View style={styles.radioDotInner} /> : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}

              {sheetItem?.detail?.addonGroups?.map((group) => (
                <View key={group.id} style={styles.detailSection}>
                  <View style={styles.detailSectionTop}>
                    <View style={styles.detailHeaderCopy}>
                      <Text style={styles.detailSectionTitle}>{group.title}</Text>
                      {group.description ? (
                        <Text style={styles.detailSectionSub}>{group.description}</Text>
                      ) : null}
                    </View>
                    {group.optionalLabel ? (
                      <Text style={styles.mutedPill}>{group.optionalLabel}</Text>
                    ) : null}
                  </View>
                  <View style={styles.optionList}>
                    {group.items.map((addon) => {
                      const active = (sheetAddons[group.id] ?? []).includes(addon.id);
                      return (
                        <Pressable
                          key={addon.id}
                          style={[styles.addonRow, active && styles.addonRowActive]}
                          onPress={() => toggleAddon(group, addon.id)}
                        >
                          <View style={styles.optionRowCopy}>
                            <Text style={styles.optionRowLabel}>{addon.label}</Text>
                            <View style={styles.row}>
                              <Text style={styles.optionRowMeta}>
                                + TK {tk(addon.priceModifier)}
                              </Text>
                              {addon.popular ? (
                                <>
                                  <Ionicons name="flame" size={11} color="#FF7A59" />
                                  <Text style={styles.popularMeta}>Popular</Text>
                                </>
                              ) : null}
                            </View>
                          </View>
                          <View style={[styles.checkBox, active && styles.checkBoxActive]}>
                            {active ? (
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}

              {sheetItem?.detail?.bundleSuggestions?.length ? (
                <View style={styles.detailSection}>
                  <View style={styles.detailSectionTop}>
                    <View style={styles.detailHeaderCopy}>
                      <Text style={styles.detailSectionTitle}>Frequently bought together</Text>
                      <Text style={styles.detailSectionSub}>
                        Smart extras people usually add with this item
                      </Text>
                    </View>
                    <Text style={styles.mutedPill}>Optional</Text>
                  </View>
                  <View style={styles.optionList}>
                    {sheetItem.detail.bundleSuggestions.map((suggestion) => {
                      const active = sheetBundles.includes(suggestion.id);
                      return (
                        <Pressable
                          key={suggestion.id}
                          style={[styles.bundleRow, active && styles.bundleRowActive]}
                          onPress={() => toggleBundle(suggestion.id)}
                        >
                          <View
                            style={[
                              styles.bundleIcon,
                              { backgroundColor: suggestion.accent },
                            ]}
                          >
                            <Ionicons
                              name={suggestion.icon as never}
                              size={18}
                              color="#20263A"
                            />
                          </View>
                          <View style={styles.bundleCopy}>
                            <Text style={styles.optionRowLabel}>{suggestion.label}</Text>
                            <Text style={styles.optionRowMeta}>
                              + TK {tk(suggestion.priceModifier)}
                            </Text>
                          </View>
                          <View style={[styles.checkBox, active && styles.checkBoxActive]}>
                            {active ? (
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Special instructions</Text>
                <Text style={styles.detailSectionSub}>
                  Let the restaurant know anything special for this order.
                </Text>
                <View style={styles.noteBox}>
                  <TextInput
                    value={sheetNote}
                    onChangeText={(text) => setSheetNote(text.slice(0, noteLimit))}
                    placeholder={
                      sheetItem?.detail?.instructionsPlaceholder ??
                      "Less spicy, no onions, extra napkins..."
                    }
                    placeholderTextColor="#A79B92"
                    multiline
                    textAlignVertical="top"
                    style={styles.noteInput}
                  />
                  <Text style={styles.noteCount}>
                    {sheetNote.length}/{noteLimit}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <View style={styles.sheetQtyBar}>
                <Pressable
                  style={styles.sheetQtyBtn}
                  onPress={() => setSheetQty((value) => Math.max(1, value - 1))}
                >
                  <Ionicons name="remove" size={16} color="#6F6A77" />
                </Pressable>
                <Text style={styles.sheetQtyText}>{sheetQty}</Text>
                <Pressable
                  style={[styles.sheetQtyBtn, styles.sheetQtyBtnActive]}
                  onPress={() => setSheetQty((value) => value + 1)}
                >
                  <Ionicons name="add" size={16} color="#FFB100" />
                </Pressable>
              </View>
              <Pressable style={styles.addBtn} onPress={addConfigured}>
                <Text style={styles.addBtnText}>Add to cart</Text>
                <Text style={styles.addBtnPrice}>TK {sheetUnitTk * sheetQty}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF7F2" },
  content: { paddingHorizontal: 14, paddingBottom: 32, gap: 16 },
  contentCart: { paddingBottom: 150 },
  top: { marginTop: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topRight: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF", shadowColor: "#D9C2B2", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  hero: { height: 214, borderRadius: 30, overflow: "hidden" },
  heroImg: { width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(22, 25, 40, 0.36)" },
  logo: { position: "absolute", top: 16, left: 16, width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  heroCopy: { position: "absolute", left: 18, right: 18, bottom: 18, gap: 10 },
  heroTitle: { fontSize: 28, lineHeight: 32, fontWeight: "900", color: "#FFF" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ratePill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: "#FFF1CC" },
  rateText: { fontSize: 12, fontWeight: "800", color: "#9B6500" },
  metaText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.86)" },
  offer: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 22, borderWidth: 1, borderColor: "#F0D9D5", borderStyle: "dashed", backgroundColor: "#FFFDFB" },
  offerIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#FFE7EF" },
  offerCopy: { flex: 1, gap: 3 },
  offerTitle: { fontSize: 14, fontWeight: "900", color: "#20263A" },
  offerText: { fontSize: 12, lineHeight: 18, color: "#7B6F69" },
  stickyWrap: {
    marginHorizontal: -14,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 6,
    backgroundColor: "#FFF7F2",
    gap: 10,
    zIndex: 10,
  },
  search: { minHeight: 56, borderRadius: 20, paddingHorizontal: 16, backgroundColor: "#FFF", flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: "#20263A" },
  tabs: { gap: 18, paddingBottom: 4, paddingRight: 18 },
  tab: { paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#20263A" },
  tabText: { fontSize: 14, fontWeight: "800", color: "#8A7E75" },
  tabTextActive: { color: "#20263A" },
  section: { gap: 12 },
  sectionHead: { gap: 6 },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#20263A" },
  sectionSub: { fontSize: 13, color: "#7B6F69" },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  popularCard: { width: "48.2%", borderRadius: 22, backgroundColor: "#FFF", padding: 12, gap: 10, position: "relative", minHeight: 220 },
  popularInfo: { gap: 8, flex: 1 },
  popularArt: { height: 104, borderRadius: 18, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  popularArtImage: { width: "100%", height: "100%" },
  popularName: { fontSize: 15, fontWeight: "900", color: "#20263A" },
  popularPrice: { fontSize: 13, color: "#7B6F69" },
  list: { gap: 12 },
  card: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 24, backgroundColor: "#FFF" },
  cardCopy: { flex: 1, gap: 5 },
  cardTitle: { fontSize: 17, fontWeight: "900", color: "#20263A" },
  cardPrice: { fontSize: 14, fontWeight: "800", color: "#20263A" },
  cardDesc: { fontSize: 12, lineHeight: 18, color: "#7B6F69" },
  cardHint: { fontSize: 12, lineHeight: 18, color: "#5C7CFA" },
  optionText: { fontSize: 12, fontWeight: "700", color: "#5C7CFA" },
  cardAction: { alignItems: "flex-end", gap: 10 },
  cardArt: { width: 86, height: 86, borderRadius: 18, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  cardArtImage: { width: "100%", height: "100%" },
  singleAdd: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF", shadowColor: "#D9C2B2", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  qtyBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999, backgroundColor: "#FFF9F4" },
  counter: { position: "absolute", right: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999, backgroundColor: "#FFF9F4" },
  counterBtn: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#F0ECE8" },
  counterBtnActive: { backgroundColor: "#FFF1CC" },
  counterText: { minWidth: 12, textAlign: "center", fontSize: 13, fontWeight: "800", color: "#20263A" },
  cartWrap: { position: "absolute", left: 14, right: 14, bottom: 16, gap: 10 },
  cartNote: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 18, backgroundColor: "#FFF8EC", gap: 10 },
  cartNoteTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cartNoteText: { flex: 1, fontSize: 12, fontWeight: "700", color: "#6F6A77" },
  cartNoteMeta: { fontSize: 11, fontWeight: "800", color: "#8A7E75" },
  cartProgressTrack: { height: 7, borderRadius: 999, backgroundColor: "#F3E7DA", overflow: "hidden" },
  cartProgressFill: { height: "100%", borderRadius: 999, backgroundColor: "#FFB100" },
  cartBar: { minHeight: 64, borderRadius: 24, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#20263A", shadowColor: "#000000", shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  cartCount: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  cartCountText: { fontSize: 13, fontWeight: "900", color: "#20263A" },
  cartCopy: { flex: 1, gap: 2 },
  cartTitle: { fontSize: 15, fontWeight: "900", color: "#FFF" },
  cartSub: { fontSize: 12, color: "rgba(255,255,255,0.78)" },
  cartAmountPill: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: "#FFB100" },
  cartTotal: { fontSize: 15, fontWeight: "900", color: "#20263A" },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20, 23, 35, 0.32)" },
  sheet: { maxHeight: "92%", backgroundColor: "#FFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden" },
  sheetScroll: { paddingBottom: 18 },
  sheetHero: { height: 220, position: "relative" },
  sheetHeroImage: { width: "100%", height: "100%" },
  sheetHeroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(22, 25, 40, 0.12)" },
  sheetClose: { position: "absolute", top: 14, left: 14, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF7F2" },
  sheetBody: { paddingHorizontal: 18, paddingTop: 16, gap: 6 },
  sheetTitle: { fontSize: 28, lineHeight: 32, fontWeight: "900", color: "#20263A" },
  sheetPrice: { fontSize: 18, fontWeight: "900", color: "#20263A" },
  sheetSubtitle: { fontSize: 13, lineHeight: 18, color: "#5C7CFA" },
  sheetDescription: { fontSize: 13, lineHeight: 19, color: "#7B6F69" },
  detailSection: { marginTop: 18, paddingHorizontal: 18, gap: 12 },
  detailSectionTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  detailHeaderCopy: { flex: 1, gap: 4 },
  detailSectionTitle: { fontSize: 18, fontWeight: "900", color: "#20263A" },
  detailSectionSub: { fontSize: 12, lineHeight: 17, color: "#7B6F69" },
  mutedPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#F6F1EC", fontSize: 11, fontWeight: "800", color: "#8A7E75", overflow: "hidden" },
  optionList: { gap: 10 },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 14, borderRadius: 20, backgroundColor: "#FBF7F3", borderWidth: 1, borderColor: "transparent" },
  optionRowActive: { backgroundColor: "#FFF6DE", borderColor: "#FFD35C" },
  optionRowCopy: { flex: 1, gap: 4 },
  optionRowLabel: { fontSize: 15, fontWeight: "800", color: "#20263A" },
  optionRowLabelActive: { color: "#20263A" },
  optionRowMeta: { fontSize: 13, color: "#7B6F69" },
  radioDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#D5CBC3", alignItems: "center", justifyContent: "center" },
  radioDotActive: { borderColor: "#FFB100", backgroundColor: "#FFF8DE" },
  radioDotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFB100" },
  addonRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 20, backgroundColor: "#FBF7F3", borderWidth: 1, borderColor: "transparent" },
  addonRowActive: { borderColor: "#FFCF56", backgroundColor: "#FFF8E7" },
  popularMeta: { fontSize: 11, fontWeight: "800", color: "#FF7A59" },
  checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: "#E0B74F", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  checkBoxActive: { backgroundColor: "#FFB100", borderColor: "#FFB100" },
  bundleRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 22, backgroundColor: "#FBF7F3", borderWidth: 1, borderColor: "transparent" },
  bundleRowActive: { borderColor: "#BFD2FF", backgroundColor: "#F5F8FF" },
  bundleIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bundleCopy: { flex: 1, gap: 4 },
  noteBox: { borderRadius: 20, backgroundColor: "#FBF7F3", paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, minHeight: 128, gap: 10 },
  noteInput: { flex: 1, minHeight: 82, fontSize: 14, color: "#20263A" },
  noteCount: { alignSelf: "flex-end", fontSize: 12, color: "#8A7E75" },
  sheetFooter: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 20, borderTopWidth: 1, borderTopColor: "#F1E6DD", backgroundColor: "#FFF" },
  sheetQtyBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: "#F7F2EE" },
  sheetQtyBtn: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  sheetQtyBtnActive: { backgroundColor: "#FFF1CC" },
  sheetQtyText: { minWidth: 16, textAlign: "center", fontSize: 14, fontWeight: "900", color: "#20263A" },
  addBtn: { flex: 1, minHeight: 56, borderRadius: 20, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFB100" },
  addBtnText: { fontSize: 15, fontWeight: "900", color: "#FFF" },
  addBtnPrice: { fontSize: 16, fontWeight: "900", color: "#FFF" },
});
