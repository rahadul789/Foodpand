import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

import { useAuthStore } from "@/lib/auth-store";
import {
  useAddFavoriteMutation,
  useFavoritesQuery,
  useRemoveFavoriteMutation,
} from "@/lib/favorite-queries";
import { useFavoriteStore } from "@/lib/favorite-store";
import { emitGuideBuddyEvent } from "@/lib/guide-buddy";
import { useUIStore } from "@/lib/ui-store";

type FavoriteButtonProps = {
  restaurantId: string;
  style?: StyleProp<ViewStyle>;
};

export function FavoriteButton({
  restaurantId,
  style,
}: FavoriteButtonProps) {
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);
  const guestFavoriteIds = useFavoriteStore((state) => state.favoriteIds);
  const pendingFavoriteIds = useFavoriteStore((state) => state.pendingFavoriteIds);
  const toggleGuestFavorite = useFavoriteStore((state) => state.toggleGuestFavorite);
  const markFavoritePending = useFavoriteStore((state) => state.markFavoritePending);
  const clearFavoritePending = useFavoriteStore((state) => state.clearFavoritePending);
  const { data: favoritesData } = useFavoritesQuery(Boolean(user?.id));
  const addFavoriteMutation = useAddFavoriteMutation();
  const removeFavoriteMutation = useRemoveFavoriteMutation();
  const serverFavoriteIds = favoritesData?.favoriteIds ?? [];
  const isPending = pendingFavoriteIds.includes(restaurantId);
  const isFavorite = user
    ? serverFavoriteIds.includes(restaurantId)
    : guestFavoriteIds.includes(restaurantId);

  return (
    <Pressable
      onPress={async (event) => {
        event.stopPropagation();

        if (isPending) {
          showToast("একটু wait করো...");
          return;
        }

        if (!user) {
          toggleGuestFavorite(restaurantId);
          emitGuideBuddyEvent("favorite_toggled");
          return;
        }

        markFavoritePending(restaurantId);

        try {
          if (isFavorite) {
            await removeFavoriteMutation.mutateAsync(restaurantId);
          } else {
            await addFavoriteMutation.mutateAsync(restaurantId);
          }
          emitGuideBuddyEvent("favorite_toggled");
        } catch (error) {
          showToast(
            error instanceof Error
              ? error.message
              : "Unable to update favourites right now.",
          );
        } finally {
          clearFavoritePending(restaurantId);
        }
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
