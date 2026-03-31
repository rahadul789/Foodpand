import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  paymentMethodOptions,
  usePaymentStore,
} from "@/lib/payment-store";

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const selectedMethod = usePaymentStore((state) => state.selectedMethod);
  const setSelectedMethod = usePaymentStore((state) => state.setSelectedMethod);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#20263A" />
          </Pressable>
          <View style={styles.headerMeta}>
            <Text style={styles.headerEyebrow}>Payments</Text>
            <Text style={styles.headerTitle}>Payment methods</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlowPink} />
          <View style={styles.heroGlowBlue} />
          <Text style={styles.heroTitle}>Choose how you want to pay</Text>
          <Text style={styles.heroText}>
            COD and bKash are both selectable now. Nagad stays visible as a
            future option so the payment flow already feels complete.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available now</Text>
          <Text style={styles.sectionHint}>Ready for checkout</Text>
        </View>

        {paymentMethodOptions.map((method) => {
          const active = selectedMethod === method.id;

          return (
          <Pressable
            key={method.id}
            style={[
              styles.methodCard,
              active && styles.methodCardActive,
            ]}
            onPress={() => setSelectedMethod(method.id)}
          >
            <View
              style={[
                styles.methodIconWrap,
                { backgroundColor: method.color },
              ]}
            >
              <Ionicons name={method.icon} size={20} color="#24314A" />
            </View>

            <View style={styles.methodMeta}>
              <View style={styles.methodTop}>
                <Text style={styles.methodTitle}>{method.title}</Text>
                <View
                  style={[
                    styles.badge,
                    active ? styles.badgeActive : styles.badgeMuted,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      active ? styles.badgeTextActive : styles.badgeTextMuted,
                    ]}
                  >
                    {active ? "Selected" : "Available"}
                  </Text>
                </View>
              </View>
              <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
            </View>

            <View
              style={[
                styles.radioOuter,
                active && styles.radioOuterActive,
              ]}
            >
              {active ? <View style={styles.radioInner} /> : null}
            </View>
          </Pressable>
        )})}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Coming soon</Text>
          <Text style={styles.sectionHint}>Keep the space ready</Text>
        </View>

        <View style={styles.methodCard}>
          <View
            style={[
              styles.methodIconWrap,
              { backgroundColor: "#FFF1CC" },
            ]}
          >
            <Ionicons name="wallet-outline" size={20} color="#24314A" />
          </View>

          <View style={styles.methodMeta}>
            <View style={styles.methodTop}>
              <Text style={styles.methodTitle}>Nagad</Text>
              <View style={[styles.badge, styles.badgeMuted]}>
                <Text style={[styles.badgeText, styles.badgeTextMuted]}>
                  Coming soon
                </Text>
              </View>
            </View>
            <Text style={styles.methodSubtitle}>
              This option will be available soon for mobile payments.
            </Text>
          </View>

          <Ionicons name="time-outline" size={18} color="#9B9087" />
        </View>

        <View style={styles.noteCard}>
          <View style={styles.noteIconWrap}>
            <Ionicons name="information-circle-outline" size={18} color="#24314A" />
          </View>
          <View style={styles.noteMeta}>
            <Text style={styles.noteTitle}>Future payment setup</Text>
            <Text style={styles.noteText}>
              bKash selection is already part of the user flow now, and Nagad
              can stay in a ready state until you enable it from the backend side.
            </Text>
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
    paddingBottom: 120,
    gap: 18,
  },
  header: {
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
  headerMeta: {
    flex: 1,
    gap: 2,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#8A7E75",
  },
  headerTitle: {
    fontSize: 24,
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
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#FF5D8F",
    opacity: 0.1,
    top: -66,
    right: -30,
  },
  heroGlowBlue: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#5C7CFA",
    opacity: 0.14,
    bottom: -18,
    left: -16,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
    color: "#20263A",
    maxWidth: 270,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6F6A77",
    maxWidth: 292,
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
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1E5DC",
  },
  methodCardActive: {
    borderColor: "#A9D59A",
    shadowColor: "#BFD9B5",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  methodIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  methodMeta: {
    flex: 1,
    gap: 8,
  },
  methodTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  methodTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: "#20263A",
  },
  methodSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6F6A77",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeActive: {
    backgroundColor: "#E0F4D7",
  },
  badgeMuted: {
    backgroundColor: "#F4F0EB",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
  },
  badgeTextActive: {
    color: "#2E7D32",
  },
  badgeTextMuted: {
    color: "#8A7E75",
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D6CDC6",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: "#37C978",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#37C978",
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#20263A",
    marginTop: 6,
  },
  noteIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1CC",
  },
  noteMeta: {
    flex: 1,
    gap: 6,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  noteText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#D5DAE5",
  },
});
