import { StyleSheet, View } from "react-native";

function Block({
  height,
  width = "100%",
  radius = 16,
}: {
  height: number;
  width?: number | `${number}%`;
  radius?: number;
}) {
  return <View style={[styles.block, { height, width, borderRadius: radius }]} />;
}

export function OrdersScreenSkeleton() {
  return (
    <View style={styles.stack}>
      <View style={styles.heroCard}>
        <Block height={28} width="36%" radius={12} />
        <Block height={42} width="60%" radius={14} />
        <Block height={16} width="54%" radius={10} />
        <View style={styles.timelineRow}>
          <Block height={12} width={12} radius={999} />
          <Block height={12} width={12} radius={999} />
          <Block height={12} width={12} radius={999} />
        </View>
        <Block height={52} width="100%" radius={20} />
      </View>
      <Block height={24} width="38%" radius={12} />
      <View style={styles.card}>
        <Block height={18} width="46%" radius={10} />
        <Block height={14} width="72%" radius={10} />
        <Block height={14} width="34%" radius={10} />
      </View>
      <Block height={24} width="46%" radius={12} />
      <View style={styles.card}>
        <Block height={18} width="42%" radius={10} />
        <Block height={14} width="64%" radius={10} />
        <Block height={14} width="58%" radius={10} />
      </View>
      <View style={styles.card}>
        <Block height={18} width="48%" radius={10} />
        <Block height={14} width="68%" radius={10} />
        <Block height={14} width="52%" radius={10} />
      </View>
    </View>
  );
}

export function OrderDetailSkeleton() {
  return (
    <View style={styles.stack}>
      <Block height={220} radius={30} />
      <View style={styles.row}>
        <Block height={110} width="48%" radius={24} />
        <Block height={110} width="48%" radius={24} />
      </View>
      <View style={styles.card}>
        <Block height={18} width="36%" radius={10} />
        <Block height={14} width="92%" radius={10} />
        <Block height={14} width="78%" radius={10} />
      </View>
      <View style={styles.card}>
        <Block height={18} width="28%" radius={10} />
        <Block height={14} width="86%" radius={10} />
        <Block height={14} width="74%" radius={10} />
        <Block height={14} width="66%" radius={10} />
      </View>
      <View style={styles.row}>
        <Block height={54} width="48%" radius={20} />
        <Block height={54} width="48%" radius={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  heroCard: {
    borderRadius: 34,
    padding: 18,
    backgroundColor: "#FFFFFF",
    gap: 14,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
  },
  block: {
    backgroundColor: "#EFE7E0",
  },
});
