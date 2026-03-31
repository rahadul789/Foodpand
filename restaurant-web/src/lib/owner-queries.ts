import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "./auth";
import {
  createOfferRequest,
  createMenuCategoryRequest,
  createMenuItemRequest,
  createRestaurantRequest,
  createUploadSignatureRequest,
  deleteOfferRequest,
  deleteMenuItemRequest,
  getMyOffersRequest,
  getMyMenuRequest,
  getMyRestaurantRequest,
  getOwnerInboxRequest,
  type OwnerMenuCategory,
  type OwnerMenuItem,
  type OwnerOffer,
  type OwnerOrder,
  type OwnerRestaurant,
  type UpdateOwnerRestaurantPayload,
  updateMyRestaurantRequest,
  updateOfferRequest,
  updateOfferStatusRequest,
  updateMenuItemRequest,
  updateMenuItemStatusRequest,
  updateOrderPreparationWindowRequest,
  updateOwnerOrderStatusRequest,
} from "./owner-api";

export function useMyRestaurantQuery() {
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["owner", "restaurant"],
    enabled: Boolean(token && isAuthenticated),
    retry: false,
    queryFn: () => getMyRestaurantRequest(token as string),
  });
}

export function useOwnerInboxQuery() {
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["owner", "orders", "inbox"],
    enabled: Boolean(token && isAuthenticated),
    queryFn: () => getOwnerInboxRequest(token as string),
    refetchInterval: 15_000,
  });
}

export function useMyOffersQuery() {
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["owner", "offers"],
    enabled: Boolean(token && isAuthenticated),
    queryFn: () => getMyOffersRequest(token as string),
  });
}

export function useCreateRestaurantMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      name: string;
      cuisine: string;
      address: string;
      latitude: number;
      longitude: number;
    }) => createRestaurantRequest(token as string, payload),
    onSuccess: (restaurant) => {
      queryClient.setQueryData<OwnerRestaurant>(["owner", "restaurant"], restaurant);
    },
  });
}

export function useUpdateMyRestaurantMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOwnerRestaurantPayload) =>
      updateMyRestaurantRequest(token as string, payload),
    onSuccess: (restaurant) => {
      queryClient.setQueryData<OwnerRestaurant>(["owner", "restaurant"], restaurant);
    },
  });
}

export function useCreateUploadSignatureMutation() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: (payload: {
      scope: "restaurant-logo" | "restaurant-cover" | "menu-item-image";
      entityId?: string;
    }) => createUploadSignatureRequest(token as string, payload),
  });
}

export function useMyMenuQuery() {
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["owner", "menu"],
    enabled: Boolean(token && isAuthenticated),
    queryFn: () => getMyMenuRequest(token as string),
  });
}

export function useCreateMenuCategoryMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { label: string; sortOrder?: number }) =>
      createMenuCategoryRequest(token as string, payload),
    onSuccess: (result) => {
      queryClient.setQueryData<{ restaurantId: string; restaurantName: string; menuCategories: OwnerMenuCategory[]; menuItems: OwnerMenuItem[] }>(
        ["owner", "menu"],
        (current) =>
          current
            ? {
                ...current,
                menuCategories: result.menuCategories,
              }
            : current,
      );
      queryClient.invalidateQueries({ queryKey: ["owner", "restaurant"] });
    },
  });
}

export function useCreateMenuItemMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      name: string;
      description?: string;
      price: number;
      category?: string;
      popular?: boolean;
      isActive?: boolean;
    }) => createMenuItemRequest(token as string, payload),
    onSuccess: (result) => {
      queryClient.setQueryData<{ restaurantId: string; restaurantName: string; menuCategories: OwnerMenuCategory[]; menuItems: OwnerMenuItem[] }>(
        ["owner", "menu"],
        (current) =>
          current
            ? {
                ...current,
                menuItems: result.menuItems,
              }
            : current,
      );
      queryClient.invalidateQueries({ queryKey: ["owner", "restaurant"] });
    },
  });
}

export function useUpdateMenuItemMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      itemKey: string;
      name: string;
      description?: string;
      price: number;
      category?: string;
      popular?: boolean;
      isActive?: boolean;
    }) =>
      updateMenuItemRequest(token as string, payload.itemKey, payload),
    onSuccess: (result) => {
      queryClient.setQueryData<{ restaurantId: string; restaurantName: string; menuCategories: OwnerMenuCategory[]; menuItems: OwnerMenuItem[] }>(
        ["owner", "menu"],
        (current) =>
          current
            ? {
                ...current,
                menuItems: result.menuItems,
              }
            : current,
      );
      queryClient.invalidateQueries({ queryKey: ["owner", "restaurant"] });
    },
  });
}

export function useToggleMenuItemStatusMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { itemKey: string; isActive: boolean }) =>
      updateMenuItemStatusRequest(token as string, payload.itemKey, payload.isActive),
    onSuccess: (result) => {
      queryClient.setQueryData<{ restaurantId: string; restaurantName: string; menuCategories: OwnerMenuCategory[]; menuItems: OwnerMenuItem[] }>(
        ["owner", "menu"],
        (current) =>
          current
            ? {
                ...current,
                menuItems: result.menuItems,
              }
            : current,
      );
      queryClient.invalidateQueries({ queryKey: ["owner", "restaurant"] });
    },
  });
}

export function useDeleteMenuItemMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemKey: string) => deleteMenuItemRequest(token as string, itemKey),
    onSuccess: (result) => {
      queryClient.setQueryData<{ restaurantId: string; restaurantName: string; menuCategories: OwnerMenuCategory[]; menuItems: OwnerMenuItem[] }>(
        ["owner", "menu"],
        (current) =>
          current
            ? {
                ...current,
                menuItems: result.menuItems,
              }
            : current,
      );
      queryClient.invalidateQueries({ queryKey: ["owner", "restaurant"] });
    },
  });
}

export function useCreateOfferMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<OwnerOffer, "id">) =>
      createOfferRequest(token as string, payload),
    onSuccess: (result) => {
      queryClient.setQueryData<{
        restaurantId: string;
        restaurantName: string;
        offers: OwnerOffer[];
      }>(["owner", "offers"], (current) =>
        current
          ? {
              ...current,
              offers: result.offers,
            }
          : current,
      );
      queryClient.invalidateQueries({ queryKey: ["owner", "restaurant"] });
    },
  });
}

export function useUpdateOfferMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { offerId: string } & Omit<OwnerOffer, "id">) =>
      updateOfferRequest(token as string, payload.offerId, payload),
    onSuccess: (result) => {
      queryClient.setQueryData<{
        restaurantId: string;
        restaurantName: string;
        offers: OwnerOffer[];
      }>(["owner", "offers"], (current) =>
        current
          ? {
              ...current,
              offers: result.offers,
            }
          : current,
      );
      queryClient.invalidateQueries({ queryKey: ["owner", "restaurant"] });
    },
  });
}

export function useToggleOfferStatusMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { offerId: string; isActive: boolean }) =>
      updateOfferStatusRequest(token as string, payload.offerId, payload.isActive),
    onSuccess: (result) => {
      queryClient.setQueryData<{
        restaurantId: string;
        restaurantName: string;
        offers: OwnerOffer[];
      }>(["owner", "offers"], (current) =>
        current
          ? {
              ...current,
              offers: result.offers,
            }
          : current,
      );
      queryClient.invalidateQueries({ queryKey: ["owner", "restaurant"] });
    },
  });
}

export function useDeleteOfferMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) => deleteOfferRequest(token as string, offerId),
    onSuccess: (result) => {
      queryClient.setQueryData<{
        restaurantId: string;
        restaurantName: string;
        offers: OwnerOffer[];
      }>(["owner", "offers"], (current) =>
        current
          ? {
              ...current,
              offers: result.offers,
            }
          : current,
      );
      queryClient.invalidateQueries({ queryKey: ["owner", "restaurant"] });
    },
  });
}

export function useOwnerOrderStatusMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      orderId: string;
      status: OwnerOrder["status"];
      note?: string;
      prepareMinMinutes?: number;
      prepareMaxMinutes?: number;
    }) =>
      updateOwnerOrderStatusRequest(token as string, payload.orderId, {
        status: payload.status,
        note: payload.note,
        prepareMinMinutes: payload.prepareMinMinutes,
        prepareMaxMinutes: payload.prepareMaxMinutes,
      }),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData<OwnerOrder[]>(["owner", "orders", "inbox"], (current) =>
        (current ?? []).map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order,
        ),
      );
    },
  });
}

export function useUpdatePreparationWindowMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      orderId: string;
      prepareMinMinutes: number;
      prepareMaxMinutes: number;
      note?: string;
    }) =>
      updateOrderPreparationWindowRequest(token as string, payload.orderId, {
        prepareMinMinutes: payload.prepareMinMinutes,
        prepareMaxMinutes: payload.prepareMaxMinutes,
        note: payload.note,
      }),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData<OwnerOrder[]>(["owner", "orders", "inbox"], (current) =>
        (current ?? []).map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order,
        ),
      );
    },
  });
}
