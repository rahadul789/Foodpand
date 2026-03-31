import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { dummyCategories } from "@/lib/customer-data";

export default function CategoriesScreen() {
  const router = useRouter();

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
          <Text style={styles.topTitle}>All categories</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBubbleOne} />
          <View style={styles.heroBubbleTwo} />
          <Text style={styles.heroTitle}>Pick a craving and jump in</Text>
          <Text style={styles.heroText}>
            Browse every category in one place, then go straight to matching
            restaurants.
          </Text>
        </View>

        <View style={styles.grid}>
          {dummyCategories.map((category) => (
            <Pressable
              key={category.id}
              style={styles.categoryCard}
              onPress={() =>
                router.push({
                  pathname: "/search-results",
                  params: { q: category.label, filter: "all", sort: "nearest" },
                })
              }
            >
              <View
                style={[
                  styles.categoryIconWrap,
                  { backgroundColor: category.accent },
                ]}
              >
                <Ionicons
                  name={category.icon as never}
                  size={22}
                  color="#20263A"
                />
              </View>
              <Text style={styles.categoryLabel}>{category.label}</Text>
              <View style={styles.categoryCta}>
                <Text style={styles.categoryCtaText}>Explore</Text>
                <Ionicons name="arrow-forward" size={14} color="#20263A" />
              </View>
            </Pressable>
          ))}
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
    paddingBottom: 36,
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
    backgroundColor: "#FFF0E7",
    overflow: "hidden",
    gap: 10,
  },
  heroBubbleOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFD166",
    top: -62,
    right: -44,
    opacity: 0.48,
  },
  heroBubbleTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#7BDFF2",
    bottom: -32,
    left: -26,
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
    maxWidth: 280,
    fontSize: 14,
    lineHeight: 21,
    color: "#6F6A77",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "48%",
    borderRadius: 26,
    padding: 16,
    backgroundColor: "#FFFFFF",
    gap: 14,
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  categoryIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#20263A",
  },
  categoryCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryCtaText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#20263A",
  },
});
