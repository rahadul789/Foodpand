import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OffersListSkeleton } from "@/components/content-skeletons";
import { dummyHomePromos } from "@/lib/customer-data";
import { usePromosQuery } from "@/lib/content-queries";

export default function OffersScreen() {
  const router = useRouter();
  const { data: promosData, isLoading } = usePromosQuery();
  const promos = promosData ?? dummyHomePromos;

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
          <Text style={styles.topTitle}>Hot deals</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBubbleOne} />
          <View style={styles.heroBubbleTwo} />
          <Text style={styles.heroTitle}>All deals in one place</Text>
          <Text style={styles.heroText}>
            Browse every promo card, open the details, and decide which one fits
            your next order best.
          </Text>
        </View>

        {isLoading ? (
          <OffersListSkeleton />
        ) : (
          <View style={styles.cardList}>
            {promos.map((promo) => (
              <Pressable
                key={promo.id}
                style={[styles.offerCard, { backgroundColor: promo.bg }]}
                onPress={() =>
                  router.push({
                    pathname: "/offer/[id]",
                    params: { id: promo.id },
                  })
                }
              >
                <View
                  style={[styles.offerGlowLarge, { backgroundColor: promo.glow }]}
                />
                <View style={styles.offerGlowSmall} />
                {promo.eyebrow ? (
                  <Text style={styles.offerEyebrow}>{promo.eyebrow}</Text>
                ) : null}
                <Text style={styles.offerTitle}>{promo.title}</Text>
                <Text style={styles.offerNote}>{promo.note}</Text>
                <View style={styles.offerFooter}>
                  <View style={styles.offerPill}>
                    <Ionicons name="ticket-outline" size={14} color="#20263A" />
                    <Text style={styles.offerPillText}>
                      {promo.code ?? "Offer details"}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              </Pressable>
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
    backgroundColor: "#FFF1E8",
    overflow: "hidden",
    gap: 10,
  },
  heroBubbleOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFD166",
    top: -60,
    right: -44,
    opacity: 0.48,
  },
  heroBubbleTwo: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#FF5D8F",
    bottom: -32,
    left: -24,
    opacity: 0.18,
  },
  heroTitle: {
    maxWidth: 240,
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
  cardList: {
    gap: 14,
  },
  offerCard: {
    minHeight: 172,
    borderRadius: 30,
    padding: 20,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  offerGlowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -50,
    right: -34,
    opacity: 0.92,
  },
  offerGlowSmall: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    left: -18,
    bottom: -18,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  offerEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.82)",
  },
  offerTitle: {
    marginTop: 10,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  offerNote: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.88)",
  },
  offerFooter: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  offerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  offerPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#20263A",
  },
});
