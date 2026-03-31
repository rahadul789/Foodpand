import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUIStore } from "@/lib/ui-store";

type QuickTopic = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  query: string;
  color: string;
};

type SupportCategory = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

type HelpArticle = {
  id: string;
  title: string;
  body: string;
  category: string;
  keywords: string[];
};

const quickTopics: QuickTopic[] = [
  {
    id: "late-order",
    label: "Late order",
    icon: "time-outline",
    query: "late order",
    color: "#FFE3D8",
  },
  {
    id: "refund",
    label: "Refund",
    icon: "cash-outline",
    query: "refund",
    color: "#E8EDFF",
  },
  {
    id: "wrong-item",
    label: "Wrong item",
    icon: "restaurant-outline",
    query: "wrong item",
    color: "#FFF1CC",
  },
  {
    id: "cancel-order",
    label: "Cancel",
    icon: "close-circle-outline",
    query: "cancel order",
    color: "#E0F4D7",
  },
];

const supportCategories: SupportCategory[] = [
  {
    id: "order-issues",
    title: "Order issues",
    description: "Late order, missing item, wrong item and rider problems.",
    icon: "receipt-outline",
    color: "#FFE3D8",
  },
  {
    id: "payments",
    title: "Payments & refunds",
    description: "COD, failed payment, coupon issues and refund status.",
    icon: "card-outline",
    color: "#E8EDFF",
  },
  {
    id: "delivery",
    title: "Delivery & location",
    description: "Address changes, coverage area and map-related help.",
    icon: "location-outline",
    color: "#E0F4D7",
  },
  {
    id: "account",
    title: "Account & profile",
    description: "Login, saved address, notifications and profile basics.",
    icon: "person-outline",
    color: "#FFF1CC",
  },
];

const helpArticles: HelpArticle[] = [
  {
    id: "where-is-order",
    title: "Where is my order?",
    body: "Go to Orders to track active delivery. If the ETA feels unusual, contact support from the order details page so we can help faster.",
    category: "Order issues",
    keywords: ["track", "late", "delivery", "order status"],
  },
  {
    id: "missing-item",
    title: "I received a missing item",
    body: "Open the order details, review the item list, then report the missing item. Keep photos of the package if possible so support can review quickly.",
    category: "Order issues",
    keywords: ["missing", "item", "order issue"],
  },
  {
    id: "wrong-item",
    title: "I got the wrong item",
    body: "Use the help flow for the related order and choose wrong item. We usually ask for a quick photo and a short note to verify the issue.",
    category: "Order issues",
    keywords: ["wrong", "item", "food", "incorrect"],
  },
  {
    id: "cancel-order",
    title: "Can I cancel an order?",
    body: "Cancellation depends on restaurant preparation status. If the kitchen has not started yet, cancellation is often easier. Once preparation starts, charges may apply.",
    category: "Payments & refunds",
    keywords: ["cancel", "order", "refund"],
  },
  {
    id: "refund-status",
    title: "How do refunds work?",
    body: "Refund timelines depend on the issue and payment method. Approved adjustments are shown in your support thread or follow-up message from the team.",
    category: "Payments & refunds",
    keywords: ["refund", "money", "failed payment", "coupon"],
  },
  {
    id: "coupon-help",
    title: "Why is my coupon not working?",
    body: "Only one offer can be active at a time. Some vouchers require a minimum basket or specific restaurants, and threshold discounts may pause coupons automatically.",
    category: "Payments & refunds",
    keywords: ["coupon", "voucher", "offer", "threshold discount"],
  },
  {
    id: "change-address",
    title: "How do I change my delivery address?",
    body: "Go to Profile, open Saved addresses, and update or add a location. You can also choose from map and make one address your selected delivery address.",
    category: "Delivery & location",
    keywords: ["address", "location", "map", "saved address"],
  },
  {
    id: "coverage-help",
    title: "Why are no restaurants showing in my area?",
    body: "If your selected location is outside the delivery coverage area, the app may not show restaurants. Try changing location or selecting a nearby saved address.",
    category: "Delivery & location",
    keywords: ["area", "coverage", "no restaurants", "location"],
  },
  {
    id: "login-help",
    title: "I cannot log in to my account",
    body: "Check your email and password first. If you started from Orders, Checkout or Profile, you will return to the same place after a successful login.",
    category: "Account & profile",
    keywords: ["login", "password", "account", "signup"],
  },
  {
    id: "saved-address-limit",
    title: "How many addresses can I save?",
    body: "You can save up to three addresses right now. Remove an old one before adding a new location if you have already reached the limit.",
    category: "Account & profile",
    keywords: ["saved address", "limit", "profile"],
  },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);
  const [query, setQuery] = useState("");
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(
    helpArticles[0]?.id ?? null,
  );

  const trimmedQuery = query.trim().toLowerCase();

  const filteredArticles = useMemo(() => {
    if (!trimmedQuery) {
      return helpArticles;
    }

    return helpArticles.filter((article) => {
      const haystack = [
        article.title,
        article.body,
        article.category,
        ...article.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(trimmedQuery);
    });
  }, [trimmedQuery]);

  const handleTopicPress = (topic: QuickTopic) => {
    setQuery(topic.query);
    const firstMatch = helpArticles.find((article) => {
      const haystack = [
        article.title,
        article.body,
        article.category,
        ...article.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(topic.query.toLowerCase());
    });

    setExpandedArticleId(firstMatch?.id ?? null);
  };

  const handleSupportAction = (action: "chat" | "call") => {
    if (action === "chat") {
      router.push("/support-chat");
      return;
    }

    showToast("Call support will be added soon.");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[2]}
      >
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#20263A" />
          </Pressable>
          <View style={styles.topMeta}>
            <Text style={styles.topMetaLabel}>Help center</Text>
            <Text style={styles.topMetaValue}>24/7 support basics</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlowPink} />
          <View style={styles.heroGlowYellow} />
          <Text style={styles.heroEyebrow}>Support made simple</Text>
          <Text style={styles.heroTitle}>How can we help today?</Text>
          <Text style={styles.heroText}>
            Search a problem, open quick help topics, or jump into support
            actions when you need a hand.
          </Text>
        </View>

        <View style={styles.stickySearchShell}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color="#8A7E75" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search help articles..."
              placeholderTextColor="#9B9087"
              style={styles.searchInput}
            />
            {query.length > 0 ? (
              <Pressable
                style={styles.clearButton}
                onPress={() => {
                  setQuery("");
                  setExpandedArticleId(helpArticles[0]?.id ?? null);
                }}
              >
                <Ionicons name="close" size={16} color="#20263A" />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick help</Text>
          <Text style={styles.sectionHint}>Tap a common issue</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicRow}
        >
          {quickTopics.map((topic) => (
            <Pressable
              key={topic.id}
              style={[styles.topicChip, { backgroundColor: topic.color }]}
              onPress={() => handleTopicPress(topic)}
            >
              <View style={styles.topicIconWrap}>
                <Ionicons name={topic.icon} size={16} color="#24314A" />
              </View>
              <Text style={styles.topicLabel}>{topic.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Support categories</Text>
          <Text style={styles.sectionHint}>For faster self-service</Text>
        </View>

        <View style={styles.categoryGrid}>
          {supportCategories.map((category) => (
            <Pressable
              key={category.id}
              style={[styles.categoryCard, { backgroundColor: category.color }]}
              onPress={() => {
                setQuery(category.title);
                setExpandedArticleId(null);
              }}
            >
              <View style={styles.categoryIconWrap}>
                <Ionicons name={category.icon} size={18} color="#24314A" />
              </View>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryText}>{category.description}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {trimmedQuery ? "Search results" : "Popular help"}
          </Text>
          <Text style={styles.sectionHint}>
            {filteredArticles.length} article
            {filteredArticles.length === 1 ? "" : "s"}
          </Text>
        </View>

        {filteredArticles.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="help-buoy-outline"
                size={28}
                color="#5C7CFA"
              />
            </View>
            <Text style={styles.emptyTitle}>No help article found</Text>
            <Text style={styles.emptyText}>
              Try a broader keyword like refund, order, address or login.
            </Text>
          </View>
        ) : (
          <View style={styles.articleList}>
            {filteredArticles.map((article) => {
              const expanded = expandedArticleId === article.id;

              return (
                <Pressable
                  key={article.id}
                  style={styles.articleCard}
                  onPress={() =>
                    setExpandedArticleId(expanded ? null : article.id)
                  }
                >
                  <View style={styles.articleTop}>
                    <View style={styles.articleMeta}>
                      <Text style={styles.articleCategory}>
                        {article.category}
                      </Text>
                      <Text style={styles.articleTitle}>{article.title}</Text>
                    </View>
                    <Ionicons
                      name={expanded ? "remove" : "add"}
                      size={20}
                      color="#24314A"
                    />
                  </View>
                  {expanded ? (
                    <Text style={styles.articleBody}>{article.body}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.supportCard}>
          <View style={styles.supportHeader}>
            <Text style={styles.supportTitle}>Still need help?</Text>
            <Text style={styles.supportText}>
              Reach support directly for order-specific assistance.
            </Text>
          </View>
          <View style={styles.supportActions}>
            <Pressable
              style={[styles.supportButton, styles.supportButtonDark]}
              onPress={() => handleSupportAction("chat")}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.supportButtonDarkText}>Chat with us</Text>
            </Pressable>
            <Pressable
              style={[styles.supportButton, styles.supportButtonLight]}
              onPress={() => handleSupportAction("call")}
            >
              <Ionicons name="call-outline" size={18} color="#20263A" />
              <Text style={styles.supportButtonLightText}>Call support</Text>
            </Pressable>
          </View>
        </View>
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
    paddingBottom: 140,
    gap: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  topMeta: {
    flex: 1,
    gap: 2,
  },
  topMetaLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#8A7E75",
  },
  topMetaValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#20263A",
  },
  heroCard: {
    borderRadius: 30,
    padding: 20,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  heroGlowPink: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FF5D8F",
    opacity: 0.12,
    top: -70,
    right: -36,
  },
  heroGlowYellow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFD166",
    opacity: 0.22,
    bottom: -24,
    left: -12,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#5C7CFA",
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    color: "#20263A",
    maxWidth: 260,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6F6A77",
    maxWidth: 280,
  },
  searchWrap: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  stickySearchShell: {
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: "#FFF7F2",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#20263A",
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F0EB",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#20263A",
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8A7E75",
  },
  topicRow: {
    gap: 12,
    paddingRight: 18,
  },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  topicIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  topicLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#24314A",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "48%",
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  categoryTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#20263A",
  },
  categoryText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#5C5763",
  },
  articleList: {
    gap: 12,
  },
  articleCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  articleTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  articleMeta: {
    flex: 1,
    gap: 6,
  },
  articleCategory: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "#FF5D8F",
  },
  articleTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    color: "#20263A",
  },
  articleBody: {
    fontSize: 13,
    lineHeight: 21,
    color: "#6F6A77",
  },
  emptyCard: {
    alignItems: "center",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 28,
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    lineHeight: 20,
    color: "#7B6F69",
    textAlign: "center",
  },
  supportCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#20263A",
    gap: 16,
  },
  supportHeader: {
    gap: 8,
  },
  supportTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  supportText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#D5DAE5",
    maxWidth: 290,
  },
  supportActions: {
    flexDirection: "row",
    gap: 12,
  },
  supportButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
  },
  supportButtonDark: {
    backgroundColor: "#FF5D8F",
  },
  supportButtonLight: {
    backgroundColor: "#FFFFFF",
  },
  supportButtonDarkText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  supportButtonLightText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#20263A",
  },
});
