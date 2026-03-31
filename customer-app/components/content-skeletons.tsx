import { StyleSheet, View } from "react-native";
import type { DimensionValue } from "react-native";

function SkeletonBlock({
  width,
  height,
  radius = 16,
}: {
  width: DimensionValue;
  height: number;
  radius?: number;
}) {
  return (
    <View
      style={[
        styles.block,
        {
          width,
          height,
          borderRadius: radius,
        },
      ]}
    />
  );
}

export function HomeContentSkeleton() {
  return (
    <View style={styles.homeWrap}>
      <QuickPicksSkeleton />
      <CategoryRailSkeleton />
      <PromoRailSkeleton />
    </View>
  );
}

export function QuickPicksSkeleton() {
  return (
    <View style={styles.quickRow}>
      <SkeletonBlock width={78} height={34} radius={18} />
      <SkeletonBlock width={78} height={34} radius={18} />
      <SkeletonBlock width={78} height={34} radius={18} />
    </View>
  );
}

export function CategoryRailSkeleton() {
  return (
    <View style={styles.categoryRow}>
      <SkeletonBlock width={94} height={98} radius={24} />
      <SkeletonBlock width={94} height={98} radius={24} />
      <SkeletonBlock width={94} height={98} radius={24} />
    </View>
  );
}

export function PromoRailSkeleton() {
  return <SkeletonBlock width="100%" height={154} radius={28} />;
}

export function FilterChipsSkeleton() {
  return (
    <View style={styles.quickRow}>
      <SkeletonBlock width={82} height={38} radius={19} />
      <SkeletonBlock width={106} height={38} radius={19} />
      <SkeletonBlock width={92} height={38} radius={19} />
    </View>
  );
}

export function CategoriesGridSkeleton() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonBlock key={index} width="48%" height={150} radius={26} />
      ))}
    </View>
  );
}

export function OffersListSkeleton() {
  return (
    <View style={styles.list}>
      <SkeletonBlock width="100%" height={170} radius={30} />
      <SkeletonBlock width="100%" height={170} radius={30} />
      <SkeletonBlock width="100%" height={170} radius={30} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: "#F1E7DF",
  },
  homeWrap: {
    gap: 18,
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  list: {
    gap: 14,
  },
});
