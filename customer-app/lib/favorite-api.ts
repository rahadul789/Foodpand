import { apiDelete, apiGet, apiPost } from "@/lib/api-client";
import type { Restaurant, RestaurantOffer } from "@/lib/customer-data";

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

type FavoriteRestaurantDto = {
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
};

type FavoritesResponseDto = {
  favoriteIds: string[];
  restaurants: FavoriteRestaurantDto[];
};

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

function mapRestaurant(dto: FavoriteRestaurantDto): Restaurant {
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
    menu: [],
  };
}

export type FavoritesResponse = {
  favoriteIds: string[];
  restaurants: Restaurant[];
};

export async function getFavoritesRequest() {
  const response = await apiGet<FavoritesResponseDto>("/api/v1/favorites");
  return {
    favoriteIds: response.data.favoriteIds,
    restaurants: response.data.restaurants.map(mapRestaurant),
  } satisfies FavoritesResponse;
}

export async function addFavoriteRequest(restaurantId: string) {
  const response = await apiPost<FavoritesResponseDto>(
    `/api/v1/favorites/${restaurantId}`,
  );
  return {
    favoriteIds: response.data.favoriteIds,
    restaurants: response.data.restaurants.map(mapRestaurant),
  } satisfies FavoritesResponse;
}

export async function removeFavoriteRequest(restaurantId: string) {
  const response = await apiDelete<FavoritesResponseDto>(
    `/api/v1/favorites/${restaurantId}`,
  );
  return {
    favoriteIds: response.data.favoriteIds,
    restaurants: response.data.restaurants.map(mapRestaurant),
  } satisfies FavoritesResponse;
}
