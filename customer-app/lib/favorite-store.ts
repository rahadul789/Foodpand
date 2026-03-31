import { create } from "zustand";

type FavoriteStore = {
  favoriteIds: string[];
  pendingFavoriteIds: string[];
  toggleGuestFavorite: (restaurantId: string) => void;
  markFavoritePending: (restaurantId: string) => void;
  clearFavoritePending: (restaurantId: string) => void;
  removeFavorite: (restaurantId: string) => void;
  clearFavorites: () => void;
};

export const useFavoriteStore = create<FavoriteStore>((set) => ({
  favoriteIds: [],
  pendingFavoriteIds: [],
  toggleGuestFavorite: (restaurantId) =>
    set((state) => {
      const alreadyFavorite = state.favoriteIds.includes(restaurantId);

      return {
        favoriteIds: alreadyFavorite
          ? state.favoriteIds.filter((id) => id !== restaurantId)
          : [...state.favoriteIds, restaurantId],
      };
    }),
  markFavoritePending: (restaurantId) =>
    set((state) =>
      state.pendingFavoriteIds.includes(restaurantId)
        ? state
        : { pendingFavoriteIds: [...state.pendingFavoriteIds, restaurantId] },
    ),
  clearFavoritePending: (restaurantId) =>
    set((state) => ({
      pendingFavoriteIds: state.pendingFavoriteIds.filter(
        (id) => id !== restaurantId,
      ),
    })),
  removeFavorite: (restaurantId) =>
    set((state) => ({
      favoriteIds: state.favoriteIds.filter((id) => id !== restaurantId),
    })),
  clearFavorites: () => set({ favoriteIds: [], pendingFavoriteIds: [] }),
}));
