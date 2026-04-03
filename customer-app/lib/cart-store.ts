import { create } from "zustand";

import type {
  ItemConfiguration,
  MenuItem,
  Restaurant,
  RestaurantThresholdOffer,
} from "@/lib/customer-data";
import { emitGuideBuddyEvent } from "@/lib/guide-buddy";

type CartItem = {
  cartKey: string;
  itemId: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  icon: string;
  accent: string;
  quantity: number;
  unitTk: number;
  summary?: string;
  configuration?: ItemConfiguration;
};

type CouponCode = "YUMMELA" | "FREEDEL";

const yummelaMinOrderTk = 199;

type AddItemParams = {
  restaurant: Restaurant;
  item: MenuItem;
  unitTk: number;
  summary?: string;
  configuration?: ItemConfiguration;
  quantity?: number;
  cartKey?: string;
};

type ReplaceCartEntry = Omit<AddItemParams, "restaurant">;

type ReplaceCartParams = {
  restaurant: Restaurant;
  entries: ReplaceCartEntry[];
  redirectTo?: string;
};

type PendingCartSwitch = {
  currentRestaurantName: string;
  nextRestaurantName: string;
  mode: "item" | "order";
  params?: AddItemParams;
  replaceCart?: ReplaceCartParams;
  redirectTo?: string;
};

type CartState = {
  restaurantId: string | null;
  restaurantName: string | null;
  thresholdOffer: RestaurantThresholdOffer | null;
  items: Record<string, CartItem>;
  appliedCoupon: CouponCode | null;
  couponDiscountTk: number;
  pendingCartSwitch: PendingCartSwitch | null;
  addItem: (params: AddItemParams) => boolean;
  decrementItem: (itemId: string) => void;
  incrementItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  clearCoupon: () => void;
  replaceCartWithItems: (params: ReplaceCartParams) => boolean;
  confirmPendingCartSwitch: () => void;
  cancelPendingCartSwitch: () => void;
  clearCart: () => void;
};

const deliveryTk = 40;
const serviceFeeTk = 20;
export const thresholdDiscountTargetTk = 450;
export const thresholdDiscountValueTk = 50;

export function getCartCount(items: Record<string, CartItem>) {
  return Object.values(items).reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotalTk(items: Record<string, CartItem>) {
  return Object.values(items).reduce(
    (sum, item) => sum + item.quantity * item.unitTk,
    0,
  );
}

export function getCartSuggestions(
  restaurant: Restaurant | undefined,
  items: Record<string, CartItem>,
) {
  if (!restaurant) {
    return [];
  }

  const existingItemIds = new Set(Object.values(items).map((item) => item.itemId));

  return restaurant.menu
    .filter(
      (item) =>
        !existingItemIds.has(item.id) &&
        !item.optionGroups?.length &&
        !item.detail?.addonGroups?.length &&
        !item.detail?.bundleSuggestions?.length,
    )
    .slice(0, 3);
}

export function getCartBreakdown(params: {
  items: Record<string, CartItem>;
  couponDiscountTk: number;
  thresholdOffer?: RestaurantThresholdOffer | null;
}) {
  const subtotalTk = getCartSubtotalTk(params.items);
  const thresholdEnabled = Boolean(params.thresholdOffer);
  const thresholdTargetTk = params.thresholdOffer?.minOrderTk ?? 0;
  const thresholdDiscountValueTk = params.thresholdOffer?.discountTk ?? 0;
  const thresholdDiscountTk =
    !thresholdEnabled || params.couponDiscountTk > 0
      ? 0
      : subtotalTk >= thresholdTargetTk
        ? thresholdDiscountValueTk
        : 0;
  const thresholdRemainingTk = Math.max(
    thresholdTargetTk - subtotalTk,
    0,
  );
  const totalDiscountTk = params.couponDiscountTk + thresholdDiscountTk;
  const totalTk = Math.max(
    subtotalTk + deliveryTk + serviceFeeTk - totalDiscountTk,
    0,
  );

  return {
    subtotalTk,
    deliveryTk,
    serviceFeeTk,
    thresholdEnabled,
    couponDiscountTk: params.couponDiscountTk,
    thresholdDiscountTk,
    thresholdDiscountValueTk,
    thresholdRemainingTk,
    thresholdReached: thresholdDiscountTk > 0,
    thresholdTargetTk,
    discountTk: totalDiscountTk,
    totalTk,
  };
}

function buildCartEntryState(
  current: Pick<
    CartState,
    "restaurantId" | "restaurantName" | "items"
  >,
  params: AddItemParams,
) {
  const key = params.cartKey ?? params.item.id;
  const existing = current.items[key];

  return {
    restaurantId: params.restaurant.id,
    restaurantName: params.restaurant.name,
    thresholdOffer: params.restaurant.thresholdOffer ?? null,
    items: {
      ...current.items,
      [key]: {
        cartKey: key,
        itemId: params.item.id,
        restaurantId: params.restaurant.id,
        restaurantName: params.restaurant.name,
        name: params.item.name,
        icon: params.item.icon,
        accent: params.item.accent,
        quantity: (existing?.quantity ?? 0) + (params.quantity ?? 1),
        unitTk: params.unitTk,
        summary: params.summary ?? existing?.summary,
        configuration: params.configuration ?? existing?.configuration,
      },
    },
  };
}

function buildCartStateFromEntries(params: ReplaceCartParams) {
  const items = params.entries.reduce<Record<string, CartItem>>((acc, entry) => {
    const key = entry.cartKey ?? entry.item.id;
    const existing = acc[key];

    acc[key] = {
      cartKey: key,
      itemId: entry.item.id,
      restaurantId: params.restaurant.id,
      restaurantName: params.restaurant.name,
      name: entry.item.name,
      icon: entry.item.icon,
      accent: entry.item.accent,
      quantity: (existing?.quantity ?? 0) + (entry.quantity ?? 1),
      unitTk: entry.unitTk,
      summary: entry.summary ?? existing?.summary,
      configuration: entry.configuration ?? existing?.configuration,
    };

    return acc;
  }, {});

  return {
    restaurantId: params.restaurant.id,
    restaurantName: params.restaurant.name,
    thresholdOffer: params.restaurant.thresholdOffer ?? null,
    items,
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  restaurantId: null,
  restaurantName: null,
  thresholdOffer: null,
  items: {},
  appliedCoupon: null,
  couponDiscountTk: 0,
  pendingCartSwitch: null,
  addItem: (params) => {
    const state = get();

    if (state.restaurantId && state.restaurantId !== params.restaurant.id) {
      set({
        pendingCartSwitch: {
          currentRestaurantName: state.restaurantName ?? "Current restaurant",
          nextRestaurantName: params.restaurant.name,
          mode: "item",
          params,
        },
      });
      return false;
    }

    set((current) => {
      return {
        ...buildCartEntryState(current, params),
        pendingCartSwitch: null,
      };
    });
    emitGuideBuddyEvent("item_added", { itemName: params.item.name });

    return true;
  },
  replaceCartWithItems: (params) => {
    const state = get();
    const hasCurrentItems = Object.keys(state.items).length > 0;

    if (
      hasCurrentItems &&
      state.restaurantId &&
      state.restaurantId !== params.restaurant.id
    ) {
      set({
        pendingCartSwitch: {
          currentRestaurantName: state.restaurantName ?? "Current restaurant",
          nextRestaurantName: params.restaurant.name,
          mode: "order",
          replaceCart: params,
          redirectTo: params.redirectTo,
        },
      });
      return false;
    }

    set({
      ...buildCartStateFromEntries(params),
      appliedCoupon: null,
      couponDiscountTk: 0,
      pendingCartSwitch: null,
    });

    return true;
  },
  decrementItem: (itemId) =>
    set((current) => {
      const existing = current.items[itemId];
      if (!existing) {
        return current;
      }

      if (existing.quantity <= 1) {
        const clone = { ...current.items };
        delete clone[itemId];
        const hasItems = Object.keys(clone).length > 0;

        return {
          items: clone,
          restaurantId: hasItems ? current.restaurantId : null,
          restaurantName: hasItems ? current.restaurantName : null,
          thresholdOffer: hasItems ? current.thresholdOffer : null,
          appliedCoupon: hasItems ? current.appliedCoupon : null,
          couponDiscountTk: hasItems ? current.couponDiscountTk : 0,
        };
      }

      return {
        items: {
          ...current.items,
          [itemId]: { ...existing, quantity: existing.quantity - 1 },
        },
      };
    }),
  incrementItem: (itemId) =>
    set((current) => {
      const existing = current.items[itemId];
      if (!existing) {
        return current;
      }

      return {
        items: {
          ...current.items,
          [itemId]: { ...existing, quantity: existing.quantity + 1 },
        },
      };
    }),
  removeItem: (itemId) =>
    set((current) => {
      if (!current.items[itemId]) {
        return current;
      }

      const clone = { ...current.items };
      delete clone[itemId];
      const hasItems = Object.keys(clone).length > 0;

      return {
        items: clone,
        restaurantId: hasItems ? current.restaurantId : null,
        restaurantName: hasItems ? current.restaurantName : null,
        thresholdOffer: hasItems ? current.thresholdOffer : null,
        appliedCoupon: hasItems ? current.appliedCoupon : null,
        couponDiscountTk: hasItems ? current.couponDiscountTk : 0,
      };
    }),
  applyCoupon: (code) => {
    const normalized = code.trim().toUpperCase();
    const state = get();
    const subtotalTk = getCartSubtotalTk(state.items);

    if (!normalized) {
      return { ok: false, message: "Enter a coupon code." };
    }

    if (subtotalTk === 0) {
      return { ok: false, message: "Add items to apply a coupon." };
    }

    if (state.appliedCoupon && state.appliedCoupon !== normalized) {
      return {
        ok: false,
        message: "Only one offer can be used at a time. Remove the current coupon first.",
      };
    }

    if (state.thresholdOffer && subtotalTk >= state.thresholdOffer.minOrderTk) {
      return {
        ok: false,
        message: "Threshold offer is already active. Only one offer can be used at a time.",
      };
    }

    if (normalized === "YUMMELA") {
      if (subtotalTk < yummelaMinOrderTk) {
        return {
          ok: false,
          message: `YUMMELA use korte minimum TK ${yummelaMinOrderTk} order korte hobe.`,
        };
      }

      set({ appliedCoupon: "YUMMELA", couponDiscountTk: 50 });
      emitGuideBuddyEvent("coupon_applied");
      return { ok: true, message: "YUMMELA applied. You saved TK 50." };
    }

    if (normalized === "FREEDEL") {
      set({ appliedCoupon: "FREEDEL", couponDiscountTk: deliveryTk });
      emitGuideBuddyEvent("coupon_applied");
      return { ok: true, message: "FREEDEL applied. Delivery is free." };
    }

    return { ok: false, message: "Coupon code is not valid." };
  },
  clearCoupon: () => set({ appliedCoupon: null, couponDiscountTk: 0 }),
  confirmPendingCartSwitch: () =>
    set((current) => {
      if (!current.pendingCartSwitch) {
        return current;
      }

      if (current.pendingCartSwitch.mode === "order" && current.pendingCartSwitch.replaceCart) {
        return {
          ...buildCartStateFromEntries(current.pendingCartSwitch.replaceCart),
          appliedCoupon: null,
          couponDiscountTk: 0,
          pendingCartSwitch: null,
        };
      }

      if (!current.pendingCartSwitch.params) {
        return {
          pendingCartSwitch: null,
        };
      }

      return {
        ...buildCartEntryState(
          {
            restaurantId: null,
            restaurantName: null,
            items: {},
          },
          current.pendingCartSwitch.params,
        ),
        appliedCoupon: null,
        couponDiscountTk: 0,
        pendingCartSwitch: null,
      };
    }),
  cancelPendingCartSwitch: () => set({ pendingCartSwitch: null }),
  clearCart: () =>
    set({
      restaurantId: null,
      restaurantName: null,
      thresholdOffer: null,
      items: {},
      appliedCoupon: null,
      couponDiscountTk: 0,
      pendingCartSwitch: null,
    }),
}));
