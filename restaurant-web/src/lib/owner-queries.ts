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
  type UpsertOwnerMenuItemPayload,
  type UpdateOwnerRestaurantPayload,
  updateMyRestaurantRequest,
  updateOfferRequest,
  updateOfferStatusRequest,
  updateMenuItemRequest,
  updateMenuItemStatusRequest,
  updateOrderPreparationWindowRequest,
  updateOwnerOrderStatusRequest,
} from "./owner-api";
import { useToast } from "./toast";

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
  const { pushToast } = useToast();

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
      pushToast({
        title: "Restaurant created",
        description: "Your owner workspace is now linked to the restaurant profile.",
      });
    },
  });
}

export function useUpdateMyRestaurantMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  return useMutation({
    mutationFn: (payload: UpdateOwnerRestaurantPayload) =>
      updateMyRestaurantRequest(token as string, payload),
    onSuccess: (restaurant) => {
      queryClient.setQueryData<OwnerRestaurant>(["owner", "restaurant"], restaurant);
      pushToast({
        title: "Restaurant updated",
        description: "Profile changes have been saved.",
      });
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
  const { pushToast } = useToast();

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
      pushToast({
        title: "Category added",
        description: "The menu category is ready to use.",
      });
    },
  });
}

export function useCreateMenuItemMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  return useMutation({
    mutationFn: (payload: UpsertOwnerMenuItemPayload) =>
      createMenuItemRequest(token as string, payload),
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
      pushToast({
        title: "Menu item created",
        description: "The item is now available in your menu list.",
      });
    },
  });
}

export function useUpdateMenuItemMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      itemKey: string;
    } & UpsertOwnerMenuItemPayload) =>
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
      pushToast({
        title: "Menu item updated",
        description: "The latest item changes have been saved.",
      });
    },
  });
}

export function useToggleMenuItemStatusMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  return useMutation({
    mutationFn: (payload: { itemKey: string; isActive: boolean }) =>
      updateMenuItemStatusRequest(token as string, payload.itemKey, payload.isActive),
    onSuccess: (result, variables) => {
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
      pushToast({
        title: variables.isActive ? "Menu item visible" : "Menu item hidden",
        description: variables.isActive
          ? "Customers can see this item again."
          : "The item has been hidden from customers.",
      });
    },
  });
}

export function useDeleteMenuItemMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

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
      pushToast({
        title: "Menu item deleted",
        description: "The item has been removed from your menu.",
      });
    },
  });
}

export function useCreateOfferMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

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
      pushToast({
        title: "Offer created",
        description: "The campaign is now available in your offers list.",
      });
    },
  });
}

export function useUpdateOfferMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

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
      pushToast({
        title: "Offer updated",
        description: "Campaign changes have been saved.",
      });
    },
  });
}

export function useToggleOfferStatusMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  return useMutation({
    mutationFn: (payload: { offerId: string; isActive: boolean }) =>
      updateOfferStatusRequest(token as string, payload.offerId, payload.isActive),
    onSuccess: (result, variables) => {
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
      pushToast({
        title: variables.isActive ? "Offer activated" : "Offer paused",
        description: variables.isActive
          ? "Customers can use this campaign again."
          : "This campaign is currently paused.",
      });
    },
  });
}

export function useDeleteOfferMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

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
      pushToast({
        title: "Offer deleted",
        description: "The campaign has been removed.",
      });
    },
  });
}

export function useOwnerOrderStatusMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

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
      pushToast({
        title: "Order updated",
        description: `Order ${updatedOrder.orderCode || updatedOrder.id} is now ${updatedOrder.status}.`,
      });
    },
  });
}

export function useUpdatePreparationWindowMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

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
      pushToast({
        title: "Preparation time updated",
        description: `Customers will now see the revised prep window for ${updatedOrder.orderCode || updatedOrder.id}.`,
      });
    },
  });
}
