import { create } from "zustand";

import type { Order } from "@/lib/customer-data";

export const GUIDE_BUDDY_NAME = "Bela";

export type GuideBuddyEmotion =
  | "hello"
  | "calm"
  | "thinking"
  | "happy"
  | "love"
  | "angry"
  | "sleepy";

export type GuideBuddyPosition = {
  x: number;
  y: number;
};

export type GuideBuddyDockSide = "left" | "right";

export type GuideBuddyTip = {
  id: string;
  title: string;
  message: string;
  emotion: GuideBuddyEmotion;
  actionLabel?: string;
  actionRoute?: string;
};

export type GuideBuddyEventType =
  | "route_changed"
  | "item_added"
  | "coupon_applied"
  | "favorite_toggled"
  | "order_placed";

export type GuideBuddyEvent = {
  id: number;
  type: GuideBuddyEventType;
  payload?: Record<string, string | number | boolean | undefined>;
};

type GuideBuddyState = {
  enabled: boolean;
  introduced: boolean;
  position: GuideBuddyPosition | null;
  docked: boolean;
  dockSide: GuideBuddyDockSide;
  lastEvent: GuideBuddyEvent | null;
  setEnabled: (enabled: boolean) => void;
  completeIntroduction: () => void;
  setPosition: (position: GuideBuddyPosition) => void;
  setDocked: (docked: boolean, side?: GuideBuddyDockSide) => void;
  resetPosition: () => void;
  emitEvent: (
    type: GuideBuddyEventType,
    payload?: GuideBuddyEvent["payload"],
  ) => void;
};

type GuideBuddyRouteOptions = {
  firstName: string;
};

function greet(firstName: string) {
  return firstName ? `হাই ${firstName}` : "হ্যালো";
}

function matchRoute(pathname: string, value: string) {
  return pathname === value || pathname.startsWith(`${value}/`);
}

export function normalizeGuideBuddyPath(pathname: string) {
  return (
    pathname
      .replace("/(tabs)", "")
      .replace("/(auth)", "")
      .replace(/\/+/g, "/") || "/"
  );
}

export function shouldShowGuideBuddy(pathname: string) {
  return pathname !== "/splash";
}

export function getGuideBuddyIntroductionTip(firstName: string): GuideBuddyTip {
  return {
    id: "intro-bela",
    title: `${greet(firstName)}, আমি ${GUIDE_BUDDY_NAME}`,
    message:
      "আমি তোমাকে এই app বুঝে ব্যবহার করতে help করব। চাইলে settings থেকে আমায় off করতে পারবে, আর long press করলে আমায় লুকিয়েও রাখতে পারবে।",
    emotion: "hello",
    actionLabel: "ঠিক আছে",
    actionRoute: "/guide-buddy-settings",
  };
}

export function getGuideBuddyTrackingTip(
  order: Order | null | undefined,
): GuideBuddyTip | null {
  if (!order) {
    return null;
  }

  if (order.status === "Pending acceptance") {
    const placedAtMs = new Date(order.placedAt).getTime();
    const ageMinutes = Number.isNaN(placedAtMs)
      ? 0
      : Math.floor((Date.now() - placedAtMs) / 60000);

    return {
      id: `tracking-${order.id}-pending`,
      title: "Order successfully done হয়েছে",
      message:
        ageMinutes >= 8
          ? "Restaurant একটু দেরি করছে। আর কয়েক মিনিট wait করো, দরকার হলে help center থেকেও support নিতে পারবে।"
          : "Restaurant কিছুক্ষণের মধ্যেই order accept করবে। Accept হলে আমি তোমাকে next update জানাব।",
      emotion: ageMinutes >= 8 ? "thinking" : "hello",
    };
  }

  if (order.status === "Preparing") {
    return {
      id: `tracking-${order.id}-preparing`,
      title: "Restaurant order accept করেছে",
      message:
        "এখন তোমার খাবার prepare করছে। Ready হলে delivery update দেখাবে।",
      emotion: "happy",
    };
  }

  if (order.status === "Ready for pickup") {
    return {
      id: `tracking-${order.id}-ready`,
      title: "Restaurant complete à¦•à¦°à§‡à¦›à§‡",
      message:
        order.riderName
          ? `${order.riderName} order-ta accept koreche. Ekhn she restaurant theke pickup korlei tomar next live update dekhabo.`
          : "à¦¤à§‹à¦®à¦¾à¦° order pickup-à¦à¦° à¦œà¦¨à§à¦¯ ready à¦†à¦›à§‡à¥¤ à¦à¦–à¦¨ delivery partner accept à¦•à¦°à¦²à§‡ à¦†à¦¬à¦¾à¦° next update à¦ªà¦¾à¦¬à§‡à¥¤",
      emotion: "thinking",
    };
  }

  if (order.status === "On the way") {
    return {
      id: `tracking-${order.id}-ontheway`,
      title: "Order pickup হয়ে গেছে",
      message:
        "Restaurant complete করেছে, delivery partner order accept করেছে, আর এখন তোমার দিকে আসছে।",
      emotion: "love",
    };
  }

  if (order.status === "Delivered") {
    return {
      id: `tracking-${order.id}-delivered`,
      title: "Order delivered",
      message: "তোমার খাবার পৌঁছে গেছে। Hope তুমি মজা করে খাবে!",
      emotion: "happy",
    };
  }

  if (order.status === "Cancelled") {
    return {
      id: `tracking-${order.id}-cancelled`,
      title: "Order cancelled",
      message: "এই order টি আর active নেই। চাইলে নতুন করে আবার order করতে পারো।",
      emotion: "sleepy",
    };
  }

  return null;
}

export function getGuideBuddyRouteTips(
  pathname: string,
  options: GuideBuddyRouteOptions,
): GuideBuddyTip[] {
  const firstName = options.firstName;

  if (pathname === "/allow-location") {
    return [
      {
        id: "allow-location",
        title: `${greet(firstName)}।`,
        message:
          "Location allow করলে আমি তোমাকে কাছের restaurant আর delivery estimate ভালোভাবে দেখাতে পারব।",
        emotion: "hello",
      },
    ];
  }

  if (pathname === "/login" || pathname === "/signup") {
    return [
      {
        id: "auth",
        title: "চলো account ready করি",
        message:
          "Login করলে saved address, rewards আর orders সহজে manage করতে পারবে।",
        emotion: "calm",
      },
    ];
  }

  if (pathname === "/" || pathname === "/home") {
    return [
      {
        id: "home-1",
        title: `${greet(firstName)}, আজ কী খাবে?`,
        message:
          "Category থেকে খাবার explore করতে পারো, আর Hot deals-এ আজকের অফারগুলো আছে।",
        emotion: "hello",
        actionLabel: "Discover",
        actionRoute: "/discover",
      },
      {
        id: "home-2",
        title: "আমি পাশে আছি",
        message:
          "যখন দরকার হবে ট্যাপ করো। আমি ছোট ছোট hint দেব, তারপর আবার quietly পাশে থাকব।",
        emotion: "calm",
      },
    ];
  }

  if (pathname === "/discover") {
    return [
      {
        id: "discover-1",
        title: "Search দিয়ে শুরু করো",
        message:
          "Food, category বা restaurant name লিখে খুঁজতে পারো। Filter ব্যবহার করলেও result ছোট হবে।",
        emotion: "thinking",
      },
    ];
  }

  if (pathname === "/search-results") {
    return [
      {
        id: "search-results-1",
        title: "এখান থেকে choose করো",
        message:
          "যে restaurant ভালো লাগে সেটা চাপলে details page খুলে যাবে।",
        emotion: "thinking",
      },
    ];
  }

  if (matchRoute(pathname, "/restaurant")) {
    return [
      {
        id: "restaurant-1",
        title: "Menu explore করো",
        message:
          "Category tab দিয়ে section বদলাতে পারবে, আর item চাপলে option বা details দেখাবে।",
        emotion: "thinking",
      },
      {
        id: "restaurant-2",
        title: "ধীরে ধীরে নাও",
        message:
          "Size, add-on আর note থাকলে item details-এর ভেতরেই সেগুলো set করতে পারবে।",
        emotion: "calm",
      },
    ];
  }

  if (pathname === "/cart") {
    return [
      {
        id: "cart-1",
        title: "একবার মিলিয়ে নাও",
        message:
          "Quantity, coupon আর মোট দাম দেখে নাও। সব ঠিক থাকলে checkout-এ যেও।",
        emotion: "calm",
        actionLabel: "Checkout",
        actionRoute: "/checkout",
      },
    ];
  }

  if (pathname === "/checkout") {
    return [
      {
        id: "checkout-1",
        title: "শেষ check",
        message:
          "ঠিকানা আর payment method দেখে order place করলেই হবে।",
        emotion: "thinking",
      },
    ];
  }

  if (pathname === "/orders") {
    return [
      {
        id: "orders-1",
        title: "সব order এখানেই",
        message:
          "যেটা দেখতে চাও, সেটায় চাপ দাও। details আর tracking পেয়ে যাবে।",
        emotion: "calm",
      },
    ];
  }

  if (matchRoute(pathname, "/order")) {
    return [
      {
        id: "order-details-1",
        title: "এখানেই full details",
        message:
          "Cancellation rule, reorder আর delivery info এই screen থেকেই manage করা যাবে।",
        emotion: "thinking",
      },
    ];
  }

  if (pathname === "/tracking") {
    return [
      {
        id: "tracking-1",
        title: "আমি track রাখছি",
        message:
          "Restaurant status আর delivery progress এখানে update হবে।",
        emotion: "calm",
      },
    ];
  }

  if (pathname === "/profile") {
    return [
      {
        id: "profile-1",
        title: "তোমার নিজের corner",
        message:
          "Saved address, payment methods, notifications আর help এখানে manage করতে পারবে।",
        emotion: "hello",
        actionLabel: "Settings",
        actionRoute: "/guide-buddy-settings",
      },
    ];
  }

  if (pathname === "/saved-addresses") {
    return [
      {
        id: "saved-addresses-1",
        title: "ঠিকানা save রাখো",
        message:
          "Home, work বা favourite জায়গা save করলে checkout অনেক faster হবে।",
        emotion: "calm",
      },
    ];
  }

  if (pathname === "/payment-methods") {
    return [
      {
        id: "payment-1",
        title: "Payment ready রাখো",
        message:
          "যেটা তোমার easiest লাগে, সেটা আগে থেকে choose করে রাখলে checkout smooth হবে।",
        emotion: "thinking",
      },
    ];
  }

  if (pathname === "/help-center" || pathname === "/support-chat") {
    return [
      {
        id: "help-1",
        title: "Help লাগলে ভয় নেই",
        message:
          "FAQ দেখো, দরকার হলে chat support-এ কথা বলো। আমি তোমার সাথেই আছি।",
        emotion: "love",
      },
    ];
  }

  return [
    {
      id: "generic-1",
      title: `${greet(firstName)}, আমি ${GUIDE_BUDDY_NAME}`,
      message:
        "কোথাও আটকে গেলে আমাকে ট্যাপ করো। আমি ছোট্ট hint দেব, তারপর আবার quietly পাশে থাকব।",
      emotion: "hello",
    },
  ];
}

export function getGuideBuddyEventReaction(
  event: GuideBuddyEvent | null,
  firstName: string,
): GuideBuddyTip | null {
  if (!event) {
    return null;
  }

  switch (event.type) {
    case "item_added":
      return {
        id: `event-${event.id}`,
        title: "ইয়েই, cart-এ চলে গেল",
        message: `${event.payload?.itemName ?? "Item"} add হয়েছে। চাইলে আরও কিছু add করতে পারো, ${firstName || "বন্ধু"}।`,
        emotion: "happy",
        actionLabel: "কার্ট দেখি",
        actionRoute: "/cart",
      };
    case "coupon_applied":
      return {
        id: `event-${event.id}`,
        title: "দারুণ save করলে",
        message: "Coupon apply হয়েছে। এখন total price দেখে checkout করলেই হবে।",
        emotion: "happy",
        actionLabel: "Checkout",
        actionRoute: "/checkout",
      };
    case "favorite_toggled":
      return {
        id: `event-${event.id}`,
        title: "এটা মনে রাখলাম",
        message: "এই restaurant favourites-এ রয়ে গেল। পরে সহজে পেয়ে যাবে।",
        emotion: "love",
        actionLabel: "Favourites",
        actionRoute: "/(tabs)/favorites",
      };
    case "order_placed":
      return {
        id: `event-${event.id}`,
        title: "অর্ডার place হয়ে গেছে",
        message: `${firstName || "বন্ধু"}, এখন orders screen-এ গিয়ে status দেখে নাও।`,
        emotion: "happy",
        actionLabel: "Orders",
        actionRoute: "/(tabs)/orders",
      };
    case "route_changed":
    default:
      return null;
  }
}

export function emitGuideBuddyEvent(
  type: GuideBuddyEventType,
  payload?: GuideBuddyEvent["payload"],
) {
  useGuideBuddyStore.getState().emitEvent(type, payload);
}

export const useGuideBuddyStore = create<GuideBuddyState>((set) => ({
  enabled: true,
  introduced: false,
  position: null,
  docked: false,
  dockSide: "right",
  lastEvent: null,
  setEnabled: (enabled) => set({ enabled }),
  completeIntroduction: () => set({ introduced: true }),
  setPosition: (position) =>
    set((state) =>
      state.position &&
      Math.abs(state.position.x - position.x) < 0.5 &&
      Math.abs(state.position.y - position.y) < 0.5
        ? state
        : { position },
    ),
  setDocked: (docked, side) =>
    set((state) => ({
      docked,
      dockSide: side ?? state.dockSide,
    })),
  resetPosition: () => set({ position: null, docked: false, dockSide: "right" }),
  emitEvent: (type, payload) =>
    set((state) => ({
      lastEvent: {
        id: (state.lastEvent?.id ?? 0) + 1,
        type,
        payload,
      },
    })),
}));
