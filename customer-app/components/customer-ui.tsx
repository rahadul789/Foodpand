import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { MenuItem, Order, Restaurant } from "@/lib/customer-data";

export const theme = {
  colors: {
    background: "#F5F0E7",
    surface: "#FFF9F2",
    surfaceStrong: "#FFF2E8",
    text: "#201813",
    muted: "#7E736A",
    primary: "#EA5B2A",
    primaryDark: "#C5431B",
    line: "#E8DDCF",
    success: "#2D8C5B",
    dark: "#13110F",
    white: "#FFFFFF",
  },
  radius: {
    xl: 32,
    lg: 24,
    md: 18,
  },
  shadow: {
    shadowColor: "#745A3B",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  } as ViewStyle,
};

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

type ButtonProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "solid" | "outline";
  onPress?: () => void;
};

type ArtworkProps = {
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
};

type TextPillProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: string;
  textColor?: string;
};

export function AppScreen({
  children,
  scroll = true,
  contentContainerStyle,
}: ScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.staticBody, contentContainerStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function PrimaryButton({
  label,
  icon,
  variant = "solid",
  onPress,
}: ButtonProps) {
  const isOutline = variant === "outline";

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        isOutline ? styles.buttonOutline : styles.buttonSolid,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          isOutline ? styles.buttonLabelOutline : styles.buttonLabelSolid,
        ]}
      >
        {label}
      </Text>
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={isOutline ? theme.colors.primary : theme.colors.white}
        />
      ) : null}
    </Pressable>
  );
}

export function TextPill({
  label,
  icon,
  accent = theme.colors.surfaceStrong,
  textColor = theme.colors.text,
}: TextPillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: accent }]}>
      {icon ? <Ionicons name={icon} size={14} color={textColor} /> : null}
      <Text style={[styles.pillLabel, { color: textColor }]}>{label}</Text>
    </View>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  actionHref,
}: {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {actionLabel && actionHref ? (
        <Link href={actionHref as never} style={styles.sectionAction}>
          {actionLabel}
        </Link>
      ) : null}
    </View>
  );
}

export function FoodArtwork({ accent, icon, size = 88 }: ArtworkProps) {
  return (
    <View
      style={[
        styles.artwork,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: accent,
        },
      ]}
    >
      <View
        style={[
          styles.artworkInner,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: (size * 0.72) / 2,
          },
        ]}
      >
        <Ionicons name={icon} size={size * 0.34} color={theme.colors.dark} />
      </View>
      <View
        style={[
          styles.artworkOrb,
          {
            width: size * 0.18,
            height: size * 0.18,
            borderRadius: (size * 0.18) / 2,
            top: size * 0.12,
            right: size * 0.08,
          },
        ]}
      />
      <View
        style={[
          styles.artworkOrbSoft,
          {
            width: size * 0.14,
            height: size * 0.14,
            borderRadius: (size * 0.14) / 2,
            bottom: size * 0.16,
            left: size * 0.1,
          },
        ]}
      />
    </View>
  );
}

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      href={{
        pathname: "/restaurant/[id]",
        params: { id: restaurant.id },
      }}
      asChild
    >
      <Pressable style={styles.restaurantCard}>
        <View style={styles.cardTopRow}>
          <FoodArtwork accent={restaurant.accent} icon={restaurant.icon as never} />
          <View style={styles.cardTopMeta}>
            <TextPill
              label={`${restaurant.rating.toFixed(1)} rating`}
              icon="star"
              accent="#FFF2CC"
            />
            <TextPill label={restaurant.deliveryTime} icon="time-outline" />
          </View>
        </View>

        <Text style={styles.cardTitle}>{restaurant.name}</Text>
        <Text style={styles.cardSubtitle}>
          {restaurant.cuisine} | {restaurant.distance}
        </Text>

        <View style={styles.tagRow}>
          {restaurant.tags.map((tag) => (
            <TextPill key={tag} label={tag} />
          ))}
        </View>
      </Pressable>
    </Link>
  );
}

export function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <View style={styles.menuCard}>
      <FoodArtwork accent={item.accent} icon={item.icon as never} size={68} />
      <View style={styles.menuContent}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>{item.name}</Text>
          <Text style={styles.menuPrice}>${item.price.toFixed(2)}</Text>
        </View>
        <Text style={styles.menuDescription}>{item.description}</Text>
        <View style={styles.menuFooter}>
          {item.popular ? (
            <TextPill
              label="Popular"
              icon="flash-outline"
              accent="#FFE3C4"
              textColor={theme.colors.primaryDark}
            />
          ) : (
            <View />
          )}
          <PrimaryButton label="Add" icon="add" />
        </View>
      </View>
    </View>
  );
}

export function OrderCard({
  order,
  ctaLabel,
  ctaHref,
}: {
  order: Order;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderTop}>
        <View style={styles.orderIdentity}>
          <FoodArtwork accent={order.accent} icon={order.icon as never} size={62} />
          <View style={styles.orderMeta}>
            <Text style={styles.cardTitle}>{order.restaurantName}</Text>
            <Text style={styles.cardSubtitle}>
              {order.status} | {order.eta}
            </Text>
          </View>
        </View>
        <Text style={styles.menuPrice}>${order.total.toFixed(2)}</Text>
      </View>
      <Text style={styles.orderItems}>{order.items.join(" | ")}</Text>
      {ctaLabel && ctaHref ? (
        <Link href={ctaHref as never} asChild>
          <Pressable style={styles.inlineCta}>
            <Text style={styles.inlineCtaLabel}>{ctaLabel}</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
}

export function StatChip({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={16} color={theme.colors.primary} />
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
}

export function CartRow({
  title,
  subtitle,
  quantity,
  amount,
  accent,
  icon,
}: {
  title: string;
  subtitle: string;
  quantity: number;
  amount: string;
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.cartRow}>
      <FoodArtwork accent={accent} icon={icon} size={58} />
      <View style={styles.cartContent}>
        <Text style={styles.cartTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
        <View style={styles.cartFooter}>
          <View style={styles.quantityPill}>
            <Text style={styles.quantityLabel}>Qty {quantity}</Text>
          </View>
          <Text style={styles.menuPrice}>{amount}</Text>
        </View>
      </View>
    </View>
  );
}

export function ProfileRow({
  label,
  icon,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable style={styles.profileRow}>
      <View style={styles.profileRowLeft}>
        <View style={styles.profileRowIconWrap}>
          <Ionicons name={icon} size={18} color={theme.colors.primary} />
        </View>
        <Text style={styles.profileRowLabel}>{label}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={theme.colors.muted}
      />
    </Pressable>
  );
}

export function MetricText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.metricText, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 24,
  },
  staticBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: theme.colors.background,
  },
  button: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    alignSelf: "flex-start",
  },
  buttonSolid: {
    backgroundColor: theme.colors.primary,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  buttonLabelSolid: {
    color: theme.colors.white,
  },
  buttonLabelOutline: {
    color: theme.colors.primary,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 10,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: theme.colors.text,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  artwork: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  artworkInner: {
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  artworkOrb: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.82)",
  },
  artworkOrbSoft: {
    position: "absolute",
    backgroundColor: "rgba(32,24,19,0.08)",
  },
  restaurantCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    gap: 14,
    ...theme.shadow,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  cardTopMeta: {
    gap: 8,
    alignItems: "flex-end",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  menuCard: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  menuContent: {
    flex: 1,
    gap: 10,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  menuPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  menuDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.muted,
  },
  menuFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 18,
    gap: 14,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  orderIdentity: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  orderMeta: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  orderItems: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.muted,
  },
  inlineCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  inlineCtaLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surfaceStrong,
  },
  statChipLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text,
  },
  cartRow: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 16,
  },
  cartContent: {
    flex: 1,
    gap: 8,
  },
  cartTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.text,
  },
  cartFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  quantityPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceStrong,
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.text,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  profileRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileRowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceStrong,
  },
  profileRowLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  metricText: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    color: theme.colors.text,
  },
});
