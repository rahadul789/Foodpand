import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GUIDE_BUDDY_NAME, useGuideBuddyStore } from "@/lib/guide-buddy";

export default function GuideBuddySettingsScreen() {
  const router = useRouter();
  const enabled = useGuideBuddyStore((state) => state.enabled);
  const setEnabled = useGuideBuddyStore((state) => state.setEnabled);
  const resetPosition = useGuideBuddyStore((state) => state.resetPosition);

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
          <Text style={styles.topTitle}>Guide buddy</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBlobOne} />
          <View style={styles.heroBlobTwo} />
          <View style={styles.characterWrap}>
            <View style={[styles.ear, styles.earLeft]} />
            <View style={[styles.ear, styles.earRight]} />
            <View style={styles.characterBody}>
              <View style={styles.face}>
                <View style={styles.cheekRow}>
                  <View style={styles.cheek} />
                  <View style={styles.cheek} />
                </View>
                <View style={styles.eyeRow}>
                  <View style={styles.eyeShell}>
                    <View style={styles.eye} />
                    <View style={styles.eyeSparkle} />
                  </View>
                  <View style={styles.eyeShell}>
                    <View style={styles.eye} />
                    <View style={styles.eyeSparkle} />
                  </View>
                </View>
                <View style={styles.mouth} />
              </View>
              <View style={styles.belly} />
              <View style={[styles.foot, styles.footLeft]} />
              <View style={[styles.foot, styles.footRight]} />
            </View>
          </View>
          <Text style={styles.heroTitle}>{GUIDE_BUDDY_NAME}</Text>
          <Text style={styles.heroText}>
            Small on-screen companion for guidance, browsing support, and gentle
            reactions while using the app.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Show floating buddy</Text>
              <Text style={styles.settingText}>
                Keep {GUIDE_BUDDY_NAME} visible across the app for lightweight
                guidance.
              </Text>
            </View>
            <Pressable
              style={[styles.toggle, enabled && styles.toggleActive]}
              onPress={() => setEnabled(!enabled)}
            >
              <View
                style={[styles.toggleKnob, enabled && styles.toggleKnobActive]}
              />
            </Pressable>
          </View>

          <View style={styles.divider} />

          <Pressable style={styles.actionRow} onPress={resetPosition}>
            <View style={styles.actionIcon}>
              <Ionicons name="refresh-outline" size={18} color="#24314A" />
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Reset position</Text>
              <Text style={styles.actionText}>
                Move {GUIDE_BUDDY_NAME} back to the default spot.
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <InfoRow
            icon="move-outline"
            title="Draggable"
            text="You can move Bela anywhere to keep content visible."
          />
          <InfoRow
            icon="paw-outline"
            title="Pet-like behavior"
            text="Bela reacts softly, stays nearby, and docks quietly when idle."
          />
          <InfoRow
            icon="chatbubble-ellipses-outline"
            title="Guidance"
            text="Shows short hints based on the current screen and actions."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color="#24314A" />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF7F2" },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 42, gap: 18 },
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
  topTitle: { fontSize: 18, fontWeight: "900", color: "#20263A" },
  placeholder: { width: 44 },
  heroCard: {
    borderRadius: 32,
    padding: 20,
    backgroundColor: "#FFE8F0",
    overflow: "hidden",
    alignItems: "flex-start",
    gap: 10,
  },
  heroBlobOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFD166",
    top: -52,
    right: -42,
    opacity: 0.42,
  },
  heroBlobTwo: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#7BDFF2",
    bottom: -34,
    left: -24,
    opacity: 0.38,
  },
  characterWrap: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  ear: {
    position: "absolute",
    top: 10,
    width: 18,
    height: 18,
    borderRadius: 8,
    backgroundColor: "#FFF7FB",
    borderWidth: 2,
    borderColor: "#F8D8E8",
  },
  earLeft: { left: 18, transform: [{ rotate: "-32deg" }] },
  earRight: { right: 18, transform: [{ rotate: "32deg" }] },
  characterBody: {
    width: 76,
    height: 76,
    borderRadius: 28,
    backgroundColor: "#FFF7FB",
    borderWidth: 2,
    borderColor: "#F8D8E8",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  face: {
    width: 48,
    height: 36,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "#FFF0F5",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cheekRow: {
    position: "absolute",
    width: "100%",
    bottom: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  cheek: {
    width: 7,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,123,151,0.45)",
  },
  eyeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  eyeShell: {
    width: 10,
    height: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  eye: { width: 8, height: 10, borderRadius: 999, backgroundColor: "#20263A" },
  eyeSparkle: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 2.5,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  mouth: {
    marginTop: 4,
    width: 16,
    height: 8,
    borderBottomWidth: 2.5,
    borderBottomColor: "#20263A",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  belly: {
    position: "absolute",
    bottom: 12,
    width: 24,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    opacity: 0.72,
  },
  foot: {
    position: "absolute",
    bottom: -3,
    width: 14,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#FFF7FB",
    borderWidth: 2,
    borderColor: "#F8D8E8",
  },
  footLeft: { left: 14 },
  footRight: { right: 14 },
  heroTitle: { fontSize: 28, fontWeight: "900", color: "#20263A" },
  heroText: { fontSize: 14, lineHeight: 21, color: "#5F5965" },
  sectionCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#FFFFFF",
    gap: 14,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  settingCopy: { flex: 1, gap: 6 },
  settingTitle: { fontSize: 16, fontWeight: "900", color: "#20263A" },
  settingText: { fontSize: 13, lineHeight: 20, color: "#6F6A77" },
  toggle: {
    width: 58,
    height: 34,
    borderRadius: 999,
    padding: 4,
    justifyContent: "center",
    backgroundColor: "#E7E3DE",
  },
  toggleActive: { backgroundColor: "#FFB100" },
  toggleKnob: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#FFFFFF" },
  toggleKnobActive: { alignSelf: "flex-end" },
  divider: { height: 1, backgroundColor: "#F0ECE7" },
  actionRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3DE",
  },
  actionCopy: { flex: 1, gap: 3 },
  actionTitle: { fontSize: 14, fontWeight: "900", color: "#20263A" },
  actionText: { fontSize: 12, lineHeight: 18, color: "#6F6A77" },
  infoRow: { flexDirection: "row", gap: 12 },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3DE",
  },
  infoCopy: { flex: 1, gap: 3 },
  infoTitle: { fontSize: 14, fontWeight: "900", color: "#20263A" },
  infoText: { fontSize: 12, lineHeight: 18, color: "#6F6A77" },
});
