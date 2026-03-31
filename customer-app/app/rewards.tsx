import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/lib/auth-store";
import { getRewardsProfile } from "@/lib/rewards";

export default function RewardsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar style="dark" backgroundColor="#FFF7F2" />
        <View style={styles.guestWrap}>
          <View style={styles.guestBubble}>
            <Ionicons name="gift-outline" size={28} color="#20263A" />
          </View>
          <Text style={styles.guestTitle}>Login to unlock rewards</Text>
          <Text style={styles.guestText}>
            Points, tiers, and reward perks will appear here after login.
          </Text>
          <Pressable
            style={styles.guestButton}
            onPress={() =>
              router.push({
                pathname: "/login",
                params: { redirectTo: "/rewards" },
              })
            }
          >
            <Text style={styles.guestButtonText}>Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const rewards = getRewardsProfile(user.loyaltyPoints);

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
          <Text style={styles.topTitle}>Rewards</Text>
          <View style={styles.placeholder} />
        </View>

        <View
          style={[
            styles.heroCard,
            rewards.eligible ? styles.heroCardActive : styles.heroCardLocked,
          ]}
        >
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTopRow}>
            <Text style={styles.heroEyebrow}>Foodbela rewards</Text>
            <View
              style={[
                styles.tierBadge,
                rewards.eligible ? styles.tierBadgeActive : styles.tierBadgeLocked,
              ]}
            >
              <Text
                style={[
                  styles.tierBadgeText,
                  rewards.eligible
                    ? styles.tierBadgeTextActive
                    : styles.tierBadgeTextLocked,
                ]}
              >
                {rewards.tierLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{rewards.heroTitle}</Text>
          <Text style={styles.heroText}>{rewards.heroText}</Text>

          <View style={styles.pointsCard}>
            <View>
              <Text style={styles.pointsLabel}>Current points</Text>
              <Text style={styles.pointsValue}>{rewards.points}</Text>
            </View>
            <View style={styles.pointsIconWrap}>
              <Ionicons name="sparkles-outline" size={18} color="#24314A" />
            </View>
          </View>

          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              {rewards.eligible
                ? rewards.pointsToNext > 0
                  ? `${rewards.pointsToNext} pts to next tier`
                  : "Top tier reached"
                : `${rewards.pointsToNext} pts to unlock`}
            </Text>
            <Text style={styles.progressMeta}>
              {rewards.currentMilestone} / {rewards.nextMilestone}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(rewards.progress, 0.04) * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Perks</Text>
          <Text style={styles.sectionAction}>
            {rewards.eligible ? "Available now" : "Unlock to access"}
          </Text>
        </View>

        <View style={styles.benefitList}>
          {rewards.benefits.map((benefit) => (
            <View
              key={benefit.id}
              style={[
                styles.benefitCard,
                benefit.unlocked && styles.benefitCardUnlocked,
              ]}
            >
              <View
                style={[
                  styles.benefitIconWrap,
                  benefit.unlocked
                    ? styles.benefitIconWrapUnlocked
                    : styles.benefitIconWrapLocked,
                ]}
              >
                <Ionicons
                  name={benefit.unlocked ? "checkmark" : "lock-closed-outline"}
                  size={16}
                  color={benefit.unlocked ? "#1F9D57" : "#8A7E75"}
                />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitText}>{benefit.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How rewards work</Text>
          <Text style={styles.infoText}>
            This mock setup uses loyalty points to unlock tiers. Later, your
            backend can decide the real rules for points, campaigns, and
            reward eligibility.
          </Text>
          <View style={styles.ruleList}>
            <Text style={styles.ruleItem}>250 pts: Starter access</Text>
            <Text style={styles.ruleItem}>800 pts: Silver perks</Text>
            <Text style={styles.ruleItem}>1500 pts: Gold perks</Text>
          </View>
        </View>

        {!rewards.eligible ? (
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/(tabs)/home")}
          >
            <Text style={styles.primaryButtonText}>Order to earn points</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/(tabs)/home")}
          >
            <Text style={styles.primaryButtonText}>Use rewards to order smarter</Text>
          </Pressable>
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
    paddingBottom: 128,
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
    fontSize: 20,
    fontWeight: "900",
    color: "#20263A",
  },
  placeholder: {
    width: 44,
  },
  heroCard: {
    borderRadius: 32,
    padding: 20,
    overflow: "hidden",
    gap: 14,
  },
  heroCardActive: {
    backgroundColor: "#E8EDFF",
  },
  heroCardLocked: {
    backgroundColor: "#FFE8F0",
  },
  heroGlowOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#7BDFF2",
    opacity: 0.18,
    top: -60,
    right: -34,
  },
  heroGlowTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#FFD166",
    opacity: 0.26,
    bottom: -24,
    left: -20,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#6F6A77",
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tierBadgeActive: {
    backgroundColor: "#FFFFFF",
  },
  tierBadgeLocked: {
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },
  tierBadgeTextActive: {
    color: "#24314A",
  },
  tierBadgeTextLocked: {
    color: "#6F6A77",
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "900",
    color: "#20263A",
    maxWidth: 280,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6F6A77",
    maxWidth: 300,
  },
  pointsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8A7E75",
  },
  pointsValue: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: "900",
    color: "#20263A",
  },
  pointsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7CC",
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  progressTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#24314A",
  },
  progressMeta: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6F6A77",
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.72)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#5C7CFA",
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
  benefitList: {
    gap: 12,
  },
  benefitCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  benefitCardUnlocked: {
    borderWidth: 1,
    borderColor: "#E0F4D7",
    backgroundColor: "#FBFFF9",
  },
  benefitIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitIconWrapUnlocked: {
    backgroundColor: "#E7F8EE",
  },
  benefitIconWrapLocked: {
    backgroundColor: "#F4F0EB",
  },
  benefitCopy: {
    flex: 1,
    gap: 4,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#20263A",
  },
  benefitText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6F6A77",
  },
  infoCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#20263A",
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6F6A77",
  },
  ruleList: {
    gap: 6,
    marginTop: 4,
  },
  ruleItem: {
    fontSize: 13,
    fontWeight: "800",
    color: "#24314A",
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#20263A",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  guestWrap: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  guestBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#20263A",
    textAlign: "center",
  },
  guestText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#7B6F69",
    textAlign: "center",
  },
  guestButton: {
    minHeight: 54,
    paddingHorizontal: 22,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5D8F",
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
