import { useQuery } from "@tanstack/react-query";

import type {
  MenuItem,
  MenuItemAddonGroup,
  MenuItemBundleSuggestion,
  MenuItemDetail,
  MenuItemOptionChoice,
  MenuItemOptionGroup,
  Restaurant,
  RestaurantOffer,
} from "@/lib/customer-data";
import { apiGet } from "@/lib/api-client";
import type {
  RestaurantBrowseFilter,
  RestaurantBrowseSort,
} from "@/lib/restaurant-utils";

type RestaurantOfferDto = {
  type: RestaurantOffer["type"];
  title: string;
  shortLabel?: string;
  description?: string;
  code?: string;
  minOrderTk?: number;
  discountTk?: number;
  discountPercent?: number;
  maxDiscountTk?: number;
  freeDelivery?: boolean;
  isAutoApply?: boolean;
  isActive?: boolean;
  stackable?: boolean;
};

type MenuItemOptionChoiceDto = {
  id: string;
  label: string;
  priceModifier?: number;
};

type MenuItemOptionGroupDto = {
  id: string;
  title: string;
  required?: boolean;
  choices?: MenuItemOptionChoiceDto[];
};

type MenuItemAddonDto = {
  id: string;
  label: string;
  priceModifier: number;
  popular?: boolean;
};

type MenuItemAddonGroupDto = {
  id: string;
  title: string;
  maxSelect?: number;
  optionalLabel?: string;
  description?: string;
  items?: MenuItemAddonDto[];
};

type MenuItemBundleSuggestionDto = {
  id: string;
  label: string;
  priceModifier: number;
  accent: string;
  icon: string;
};

type MenuItemDetailDto = {
  image?: string;
  subtitle?: string;
  addonGroups?: MenuItemAddonGroupDto[];
  bundleSuggestions?: MenuItemBundleSuggestionDto[];
  instructionsPlaceholder?: string;
  maxInstructionsLength?: number;
};

type MenuItemDto = {
  key: string;
  name: string;
  description: string;
  price: number;
  accent: string;
  icon: string;
  category?: string;
  optionGroups?: MenuItemOptionGroupDto[];
  detail?: MenuItemDetailDto | null;
  popular?: boolean;
};

type RestaurantDto = {
  _id: string;
  key: string;
  name: string;
  cuisine: string;
  deliveryTime: string;
  rating: number;
  accent: string;
  icon: string;
  priceLevel: string;
  tags?: string[];
  address: string;
  heroTitle: string;
  heroSubtitle: string;
  coverImage: string;
  startingPrice: number;
  featured?: boolean;
  offers?: RestaurantOfferDto[];
  location?: {
    coordinates?: [number, number];
  };
  menuItems?: MenuItemDto[];
};

type RestaurantMenuResponseDto = {
  _id: string;
  key: string;
  name: string;
  menuItems: MenuItemDto[];
};

function mapOptionChoice(choice: MenuItemOptionChoiceDto): MenuItemOptionChoice {
  return {
    id: choice.id,
    label: choice.label,
    priceModifier: choice.priceModifier ?? 0,
  };
}

function mapOptionGroup(group: MenuItemOptionGroupDto): MenuItemOptionGroup {
  return {
    id: group.id,
    title: group.title,
    required: group.required,
    choices: (group.choices ?? []).map(mapOptionChoice),
  };
}

function mapAddonGroup(group: MenuItemAddonGroupDto): MenuItemAddonGroup {
  return {
    id: group.id,
    title: group.title,
    maxSelect: group.maxSelect,
    optionalLabel: group.optionalLabel,
    description: group.description,
    items: (group.items ?? []).map((item) => ({
      id: item.id,
      label: item.label,
      priceModifier: item.priceModifier,
      popular: item.popular,
    })),
  };
}

function mapBundleSuggestion(
  suggestion: MenuItemBundleSuggestionDto,
): MenuItemBundleSuggestion {
  return {
    id: suggestion.id,
    label: suggestion.label,
    priceModifier: suggestion.priceModifier,
    accent: suggestion.accent,
    icon: suggestion.icon,
  };
}

function mapDetail(detail?: MenuItemDetailDto | null): MenuItemDetail | undefined {
  if (!detail) {
    return undefined;
  }

  return {
    image: detail.image ?? "",
    subtitle: detail.subtitle,
    addonGroups: (detail.addonGroups ?? []).map(mapAddonGroup),
    bundleSuggestions: (detail.bundleSuggestions ?? []).map(mapBundleSuggestion),
    instructionsPlaceholder: detail.instructionsPlaceholder,
    maxInstructionsLength: detail.maxInstructionsLength,
  };
}

function mapMenuItem(item: MenuItemDto): MenuItem {
  return {
    id: item.key,
    name: item.name,
    description: item.description,
    price: item.price,
    accent: item.accent,
    icon: item.icon,
    category: item.category,
    optionGroups: (item.optionGroups ?? []).map(mapOptionGroup),
    detail: mapDetail(item.detail),
    popular: item.popular,
  };
}

function mapOffers(offers: RestaurantOfferDto[] | undefined): RestaurantOffer[] {
  return (offers ?? []).filter((offer) => offer.isActive !== false);
}

function getVoucherLabel(offers: RestaurantOffer[]) {
  const preferred =
    offers.find((offer) => offer.type === "voucher") ??
    offers.find(
      (offer) =>
        offer.type === "flat_discount" || offer.type === "percentage_discount",
    );

  if (!preferred) {
    return null;
  }

  return preferred.shortLabel || preferred.title;
}

function getThresholdOffer(offers: RestaurantOffer[]) {
  const threshold = offers.find((offer) => offer.type === "threshold_discount");

  if (!threshold || !threshold.minOrderTk || !threshold.discountTk) {
    return null;
  }

  return {
    minOrderTk: threshold.minOrderTk,
    discountTk: threshold.discountTk,
  };
}

function mapRestaurant(dto: RestaurantDto, includeMenu = false): Restaurant {
  const coordinates = dto.location?.coordinates ?? [0, 0];
  const offers = mapOffers(dto.offers);

  return {
    id: dto._id,
    name: dto.name,
    cuisine: dto.cuisine,
    deliveryTime: dto.deliveryTime,
    rating: dto.rating,
    distance: "",
    accent: dto.accent,
    icon: dto.icon,
    priceLevel: dto.priceLevel,
    tags: dto.tags ?? [],
    address: dto.address,
    heroTitle: dto.heroTitle,
    heroSubtitle: dto.heroSubtitle,
    coverImage: dto.coverImage,
    startingPrice: dto.startingPrice,
    latitude: coordinates[1] ?? 0,
    longitude: coordinates[0] ?? 0,
    featured: dto.featured,
    voucher: getVoucherLabel(offers),
    thresholdOffer: getThresholdOffer(offers),
    offers,
    menu: includeMenu ? (dto.menuItems ?? []).map(mapMenuItem) : [],
  };
}

function buildRestaurantPath(params: RestaurantListParams = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return `/api/v1/restaurants${query ? `?${query}` : ""}`;
}

export type RestaurantListParams = {
  q?: string;
  category?: string;
  featured?: boolean;
  offers?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
  filter?: RestaurantBrowseFilter;
  sort?: RestaurantBrowseSort;
};

export function useRestaurantsQuery(params: RestaurantListParams = {}) {
  return useQuery({
    queryKey: ["restaurants", params],
    queryFn: async () => {
      const response = await apiGet<RestaurantDto[]>(buildRestaurantPath(params));
      return response.data.map((restaurant) => mapRestaurant(restaurant));
    },
  });
}

export function useRestaurantDetailQuery(id?: string) {
  return useQuery({
    queryKey: ["restaurants", "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await apiGet<RestaurantDto>(`/api/v1/restaurants/${id}`);
      return mapRestaurant(response.data, true);
    },
  });
}

export function useRestaurantMenuQuery(id?: string) {
  return useQuery({
    queryKey: ["restaurants", "menu", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await apiGet<RestaurantMenuResponseDto>(
        `/api/v1/restaurants/${id}/menu`,
      );
      return (response.data.menuItems ?? []).map(mapMenuItem);
    },
  });
}
