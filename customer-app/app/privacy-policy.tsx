import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const sections = [
  {
    id: "info-we-collect",
    title: "Information we collect",
    body:
      "We may collect account details like name, email, phone number, saved addresses, order history, reward activity, and basic device information needed to run the app experience.",
  },
  {
    id: "how-we-use",
    title: "How we use your information",
    body:
      "Your data is used to process orders, show nearby restaurants, personalize rewards, send order updates, improve support, and keep your account secure.",
  },
  {
    id: "location-data",
    title: "Location data",
    body:
      "Location helps us show restaurants and delivery coverage near you. You can change or disable location access from your device settings, but some delivery features may work less accurately.",
  },
  {
    id: "payments",
    title: "Payments and billing",
    body:
      "Payment-related information is used only for checkout flow, order handling, and refund-related support. Future payment integrations may introduce extra policy details.",
  },
  {
    id: "sharing",
    title: "Sharing your information",
    body:
      "Order-related information may be shared with restaurants, delivery partners, and service providers only to fulfill the order, handle support, or comply with legal obligations.",
  },
  {
    id: "security",
    title: "Data security",
    body:
      "We aim to protect your information with reasonable security practices, but no digital system can guarantee absolute security in every scenario.",
  },
  {
    id: "your-controls",
    title: "Your controls",
    body:
      "You can update saved addresses, manage profile details, review notifications, and contact support if you need help with privacy-related requests.",
  },
  {
    id: "updates",
    title: "Policy updates",
    body:
      "This policy may change over time as features evolve. Important updates can be shown inside the app or through future notification channels.",
  },
];

export default function PrivacyPolicyScreen() {
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
          <Text style={styles.topTitle}>Privacy policy</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />
          <Text style={styles.heroEyebrow}>Legal</Text>
          <Text style={styles.heroTitle}>Your privacy matters to us</Text>
          <Text style={styles.heroText}>
            We are committed to protecting your personal information and using it
            responsibly to provide a safe, reliable, and personalized food
            delivery experience.
          </Text>
        </View>

        <View style={styles.noticeCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#24314A" />
          <Text style={styles.noticeText}>
            By using Foodbela, you agree to the collection and use of information
            as described in this privacy policy.
          </Text>
        </View>

        <View style={styles.sectionList}>
          {sections.map((section) => (
            <View key={section.id} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
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
    paddingBottom: 128,
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
    fontSize: 20,
    fontWeight: "900",
    color: "#20263A",
  },
  placeholder: {
    width: 44,
  },
  heroCard: {
    borderRadius: 30,
    padding: 20,
    overflow: "hidden",
    backgroundColor: "#E8EDFF",
    gap: 10,
  },
  heroGlowOne: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#7BDFF2",
    opacity: 0.18,
    top: -60,
    right: -34,
  },
  heroGlowTwo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFD166",
    opacity: 0.24,
    bottom: -18,
    left: -18,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#6F6A77",
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "900",
    color: "#20263A",
    maxWidth: 290,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6F6A77",
    maxWidth: 300,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "#FFF1CC",
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: "#6F6A77",
  },
  sectionList: {
    gap: 12,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#20263A",
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 21,
    color: "#6F6A77",
  },
});
