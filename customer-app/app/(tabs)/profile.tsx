import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getInitials, useAuthStore } from "@/lib/auth-store";
import { useActiveOrdersQuery, useOrderHistoryQuery } from "@/lib/order-queries";
import { profileOptions } from "@/lib/customer-data";
import { useSavedLocations } from "@/lib/location-store";
import { useNotificationsQuery } from "@/lib/notification-queries";
import { getRewardsProfile } from "@/lib/rewards";
import { useUIStore } from "@/lib/ui-store";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const savedLocations = useSavedLocations();
  const { data: notificationsData } = useNotificationsQuery(user?.id ?? null, Boolean(user?.id));
  const { data: activeOrders = [] } = useActiveOrdersQuery(Boolean(user?.id));
  const { data: previousOrders = [] } = useOrderHistoryQuery(Boolean(user?.id));
  const showToast = useUIStore((state) => state.showToast);
  const unreadNotifications = notificationsData?.unreadCount ?? 0;
  const totalOrders = previousOrders.length + activeOrders.length;

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar style="dark" backgroundColor="#FFF7F2" />
        <View style={styles.guestWrap}>
          <View style={styles.guestBubble}>
            <Ionicons name="person-outline" size={28} color="#20263A" />
          </View>
          <Text style={styles.guestTitle}>Login to personalize your profile</Text>
          <Text style={styles.guestText}>
            Login to unlock saved addresses, rewards, and order shortcuts.
          </Text>
          <Pressable
            style={styles.guestButton}
            onPress={() =>
              router.push({
                pathname: "/login",
                params: { redirectTo: "/(tabs)/profile" },
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

  const handleLogout = () => {
    signOut();
    showToast("Logged out");
    router.replace("/(tabs)/profile");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileBlobOne} />
          <View style={styles.profileBlobTwo} />

          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{getInitials(user.name)}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.meta}>{user.email}</Text>
          <Text style={styles.meta}>{user.location}</Text>

          <View style={styles.pointPill}>
            <Ionicons name="sparkles-outline" size={14} color="#24314A" />
            <Text style={styles.pointPillText}>{user.loyaltyPoints} pts</Text>
          </View>
        </View>

        <View style={styles.rewardCard}>
          <View style={styles.rewardTop}>
            <Text style={styles.rewardLabel}>Rewards</Text>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardBadgeText}>{rewards.tierLabel}</Text>
            </View>
          </View>
          <Text style={styles.rewardTitle}>{rewards.heroTitle}</Text>
          <Pressable
            style={styles.rewardButton}
            onPress={() => router.push("/rewards")}
          >
            <Text style={styles.rewardButtonText}>{rewards.actionLabel}</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        <SectionHeader title="Your space" action="Manage" />
        <View style={styles.quickStatsRow}>
          <Pressable
            style={[styles.quickStatCard, { backgroundColor: "#FFE3D8" }]}
            onPress={() => router.push("/saved-addresses")}
          >
            <Ionicons name="location-outline" size={18} color="#24314A" />
            <Text style={styles.quickStatTitle}>Addresses</Text>
            <Text style={styles.quickStatValue}>{savedLocations.length} saved</Text>
          </Pressable>
          <Pressable
            style={[styles.quickStatCard, { backgroundColor: "#E8EDFF" }]}
            onPress={() => router.push("/(tabs)/orders")}
          >
            <Ionicons name="receipt-outline" size={18} color="#24314A" />
            <Text style={styles.quickStatTitle}>Orders</Text>
            <Text style={styles.quickStatValue}>{totalOrders} total</Text>
          </Pressable>
        </View>

        <SectionHeader title="Settings" action="Open" />
        <View style={styles.optionList}>
          {profileOptions.map((option) => (
            <Pressable
              key={option.id}
              style={styles.optionCard}
              onPress={() => {
                if (option.label === "Saved addresses") {
                  router.push("/saved-addresses");
                  return;
                }

                if (option.label === "Payment methods") {
                  router.push("/payment-methods");
                  return;
                }

                if (option.label === "Help center") {
                  router.push("/help-center");
                  return;
                }

                if (option.label === "Notifications") {
                  router.push("/notifications");
                  return;
                }

                if (option.label === "Guide buddy") {
                  router.push("/guide-buddy-settings");
                  return;
                }

                if (option.label === "Privacy policy") {
                  router.push("/privacy-policy");
                  return;
                }

                showToast(`${option.label} will be added soon.`);
              }}
            >
              <View style={styles.optionIconWrap}>
                <Ionicons
                  name={option.icon as never}
                  size={18}
                  color="#24314A"
                />
              </View>
              <Text style={styles.optionLabel}>{option.label}</Text>
              {option.label === "Notifications" && unreadNotifications > 0 ? (
                <View style={styles.optionBadge}>
                  <Text style={styles.optionBadgeText}>{unreadNotifications}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={18} color="#9B9087" />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </ScrollView>
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
    paddingBottom: 128,
    gap: 22,
  },
  profileCard: {
    borderRadius: 34,
    padding: 20,
    backgroundColor: "#FFE8F0",
    overflow: "hidden",
    alignItems: "flex-start",
    marginTop: 4,
  },
  profileBlobOne: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#FF5D8F",
    opacity: 0.18,
    top: -58,
    right: -40,
  },
  profileBlobTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#FFD166",
    opacity: 0.28,
    bottom: -26,
    left: -22,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5D8F",
  },
  avatarLabel: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  name: {
    marginTop: 14,
    fontSize: 28,
    fontWeight: "900",
    color: "#20263A",
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
    color: "#7B6F69",
  },
  pointPill: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FFF7CC",
  },
  pointPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24314A",
  },
  rewardCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#5C7CFA",
    gap: 12,
  },
  rewardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rewardLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#DCE4FF",
  },
  rewardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  rewardBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  rewardTitle: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
    color: "#FFFFFF",
    maxWidth: 230,
  },
  rewardButton: {
    marginTop: 4,
    minHeight: 52,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FF5D8F",
  },
  rewardButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
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
  quickStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  quickStatTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#24314A",
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#20263A",
  },
  optionList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#20263A",
  },
  optionBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5D8F",
  },
  optionBadgeText: {
    fontSize: 11,
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
  logoutButton: {
    minHeight: 56,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#20263A",
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
