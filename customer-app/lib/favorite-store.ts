import { create } from "zustand";

type FavoriteStore = {
  favoriteIds: string[];
  toggleFavorite: (restaurantId: string) => void;
  removeFavorite: (restaurantId: string) => void;
  clearFavorites: () => void;
};

export const useFavoriteStore = create<FavoriteStore>((set) => ({
  favoriteIds: [],
  toggleFavorite: (restaurantId) =>
    set((state) => {
      const alreadyFavorite = state.favoriteIds.includes(restaurantId);

      return {
        favoriteIds: alreadyFavorite
          ? state.favoriteIds.filter((id) => id !== restaurantId)
          : [...state.favoriteIds, restaurantId],
      };
    }),
  removeFavorite: (restaurantId) =>
    set((state) => ({
      favoriteIds: state.favoriteIds.filter((id) => id !== restaurantId),
    })),
  clearFavorites: () => set({ favoriteIds: [] }),
}));
