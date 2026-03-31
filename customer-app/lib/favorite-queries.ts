import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addFavoriteRequest,
  type FavoritesResponse,
  getFavoritesRequest,
  removeFavoriteRequest,
} from "@/lib/favorite-api";

export function useFavoritesQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["favorites"],
    enabled,
    queryFn: getFavoritesRequest,
  });
}

type FavoriteMutationContext = {
  previousFavorites?: FavoritesResponse;
};

export function useAddFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (restaurantId: string) => addFavoriteRequest(restaurantId),
    onMutate: async (restaurantId): Promise<FavoriteMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });

      const previousFavorites = queryClient.getQueryData<FavoritesResponse>([
        "favorites",
      ]);

      queryClient.setQueryData<FavoritesResponse>(["favorites"], (current) => {
        const favoriteIds = current?.favoriteIds ?? [];

        return {
          favoriteIds: favoriteIds.includes(restaurantId)
            ? favoriteIds
            : [...favoriteIds, restaurantId],
          restaurants: current?.restaurants ?? [],
        };
      });

      return { previousFavorites };
    },
    onError: (_error, _restaurantId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(["favorites"], context.previousFavorites);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["favorites"], data);
    },
  });
}

export function useRemoveFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (restaurantId: string) => removeFavoriteRequest(restaurantId),
    onMutate: async (restaurantId): Promise<FavoriteMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });

      const previousFavorites = queryClient.getQueryData<FavoritesResponse>([
        "favorites",
      ]);

      queryClient.setQueryData<FavoritesResponse>(["favorites"], (current) => ({
        favoriteIds: (current?.favoriteIds ?? []).filter(
          (id) => id !== restaurantId,
        ),
        restaurants:
          current?.restaurants.filter((restaurant) => restaurant.id !== restaurantId) ??
          [],
      }));

      return { previousFavorites };
    },
    onError: (_error, _restaurantId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(["favorites"], context.previousFavorites);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["favorites"], data);
    },
  });
}
