import { StyleSheet, View } from "react-native";

function Block({
  height,
  width = "100%",
  radius = 18,
}: {
  height: number;
  width?: number | `${number}%`;
  radius?: number;
}) {
  return (
    <View
      style={[
        styles.block,
        {
          height,
          width,
          borderRadius: radius,
        },
      ]}
    />
  );
}

export function RestaurantCardListSkeleton({
  count = 3,
}: {
  count?: number;
}) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.card}>
          <Block height={176} radius={24} />
          <View style={styles.cardBody}>
            <Block height={18} width="62%" radius={8} />
            <Block height={12} width="44%" radius={8} />
            <View style={styles.row}>
              <Block height={12} width="22%" radius={8} />
              <Block height={12} width="26%" radius={8} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export function RestaurantRailSkeleton({
  count = 2,
}: {
  count?: number;
}) {
  return (
    <View style={styles.rail}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.railCard}>
          <Block height={136} radius={24} />
          <View style={styles.cardBody}>
            <Block height={16} width="72%" radius={8} />
            <Block height={12} width="52%" radius={8} />
            <Block height={12} width="30%" radius={8} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function RestaurantDetailSkeleton() {
  return (
    <View style={styles.detailWrap}>
      <Block height={44} width="100%" radius={22} />
      <Block height={214} width="100%" radius={30} />
      <Block height={76} width="100%" radius={22} />
      <Block height={56} width="100%" radius={20} />
      <View style={styles.row}>
        <Block height={16} width="30%" radius={8} />
        <Block height={16} width="24%" radius={8} />
        <Block height={16} width="20%" radius={8} />
      </View>
      <View style={styles.list}>
        <View style={styles.compactRow}>
          <Block height={86} width={86} radius={18} />
          <View style={styles.cardBody}>
            <Block height={16} width="70%" radius={8} />
            <Block height={12} width="46%" radius={8} />
            <Block height={12} width="58%" radius={8} />
          </View>
        </View>
        <View style={styles.compactRow}>
          <Block height={86} width={86} radius={18} />
          <View style={styles.cardBody}>
            <Block height={16} width="64%" radius={8} />
            <Block height={12} width="40%" radius={8} />
            <Block height={12} width="54%" radius={8} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: "#F1E7DF",
  },
  list: {
    gap: 14,
  },
  card: {
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  rail: {
    flexDirection: "row",
    gap: 14,
  },
  railCard: {
    flex: 1,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  cardBody: {
    padding: 14,
    gap: 10,
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  detailWrap: {
    gap: 16,
  },
  compactRow: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
});
