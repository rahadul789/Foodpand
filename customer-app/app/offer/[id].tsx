import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { dummyHomePromos } from "@/lib/customer-data";

export default function OfferDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const offer =
    dummyHomePromos.find((item) => item.id === id) ?? dummyHomePromos[0];

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
          <Text style={styles.topTitle}>Offer details</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={[styles.heroCard, { backgroundColor: offer.bg }]}>
          <View style={[styles.heroGlowLarge, { backgroundColor: offer.glow }]} />
          <View style={styles.heroGlowSmall} />
          {offer.eyebrow ? <Text style={styles.eyebrow}>{offer.eyebrow}</Text> : null}
          <Text style={styles.heroTitle}>{offer.title}</Text>
          <Text style={styles.heroNote}>{offer.note}</Text>

          <View style={styles.heroMetaRow}>
            {offer.code ? (
              <View style={styles.heroPill}>
                <Ionicons name="ticket-outline" size={14} color="#20263A" />
                <Text style={styles.heroPillText}>{offer.code}</Text>
              </View>
            ) : null}
            <View style={styles.heroPill}>
              <Ionicons name="sparkles-outline" size={14} color="#20263A" />
              <Text style={styles.heroPillText}>{offer.validFor}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About this offer</Text>
          <Text style={styles.sectionText}>{offer.description}</Text>
          {typeof offer.minOrderTk === "number" && offer.minOrderTk > 0 ? (
            <View style={styles.infoRow}>
              <Ionicons name="bag-check-outline" size={16} color="#24314A" />
              <Text style={styles.infoText}>Minimum order TK {offer.minOrderTk}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Why it is useful</Text>
          <View style={styles.listWrap}>
            {offer.perks.map((perk) => (
              <View key={perk} style={styles.listRow}>
                <View style={styles.listDot} />
                <Text style={styles.listText}>{perk}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Terms</Text>
          <View style={styles.listWrap}>
            {offer.terms.map((term) => (
              <View key={term} style={styles.termRow}>
                <Ionicons name="information-circle-outline" size={15} color="#8A7E75" />
                <Text style={styles.termText}>{term}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable style={styles.ctaButton} onPress={() => router.push("/(tabs)/home")}>
          <Text style={styles.ctaButtonText}>Back to home</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </Pressable>
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
    borderRadius: 34,
    padding: 22,
    overflow: "hidden",
    minHeight: 220,
    justifyContent: "flex-end",
  },
  heroGlowLarge: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -56,
    right: -34,
    opacity: 0.92,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    left: -18,
    bottom: -18,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.82)",
  },
  heroTitle: {
    marginTop: 12,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  heroNote: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.88)",
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#20263A",
  },
  sectionCard: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#20263A",
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6F6A77",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "#F8F4F0",
  },
  infoText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#24314A",
  },
  listWrap: {
    gap: 12,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  listDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    backgroundColor: "#FFB100",
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#6F6A77",
  },
  termRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  termText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: "#6F6A77",
  },
  ctaButton: {
    minHeight: 58,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#20263A",
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
