import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

import { useFavoriteStore } from "@/lib/favorite-store";
import { emitGuideBuddyEvent } from "@/lib/guide-buddy";

type FavoriteButtonProps = {
  restaurantId: string;
  style?: StyleProp<ViewStyle>;
};

export function FavoriteButton({
  restaurantId,
  style,
}: FavoriteButtonProps) {
  const isFavorite = useFavoriteStore((state) =>
    state.favoriteIds.includes(restaurantId),
  );
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);

  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        toggleFavorite(restaurantId);
        emitGuideBuddyEvent("favorite_toggled");
      }}
      style={[styles.button, style]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        isFavorite ? "Remove from favourites" : "Add to favourites"
      }
    >
      <Ionicons
        name={isFavorite ? "heart" : "heart-outline"}
        size={18}
        color={isFavorite ? "#FF5D8F" : "#20263A"}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "#A98E80",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
});
