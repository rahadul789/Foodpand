import { type Restaurant } from "@/lib/customer-data";

export type RestaurantBrowseFilter =
  | "all"
  | "rating-3"
  | "rating-4"
  | "under-30"
  | "offers";

export type RestaurantBrowseSort =
  | "nearest"
  | "lowest-price"
  | "highest-rating";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
) {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(toLatitude - fromLatitude);
  const deltaLongitude = toRadians(toLongitude - fromLongitude);
  const fromLatitudeRad = toRadians(fromLatitude);
  const toLatitudeRad = toRadians(toLatitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLatitudeRad) *
      Math.cos(toLatitudeRad) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getRestaurantDistanceKm(params: {
  restaurant: Restaurant;
  latitude: number;
  longitude: number;
}) {
  return calculateDistanceKm(
    params.latitude,
    params.longitude,
    params.restaurant.latitude,
    params.restaurant.longitude,
  );
}

export function formatDistanceKm(distanceKm: number) {
  return `${distanceKm.toFixed(1)} km`;
}

export function sortRestaurantsByDistance(params: {
  restaurants: Restaurant[];
  latitude: number;
  longitude: number;
}) {
  return [...params.restaurants].sort(
    (a, b) =>
      getRestaurantDistanceKm({
        restaurant: a,
        latitude: params.latitude,
        longitude: params.longitude,
      }) -
      getRestaurantDistanceKm({
        restaurant: b,
        latitude: params.latitude,
        longitude: params.longitude,
      }),
  );
}

export function getDeliveryMaxMinutes(deliveryTime: string) {
  const values = deliveryTime.match(/\d+/g)?.map(Number) ?? [];
  return values.length ? Math.max(...values) : 999;
}

export function filterRestaurants(params: {
  restaurants: Restaurant[];
  filter: RestaurantBrowseFilter;
}) {
  return params.restaurants.filter((restaurant) => {
    switch (params.filter) {
      case "rating-3":
        return restaurant.rating >= 3;
      case "rating-4":
        return restaurant.rating >= 4;
      case "under-30":
        return getDeliveryMaxMinutes(restaurant.deliveryTime) <= 30;
      case "offers":
        return (
          Boolean(restaurant.voucher) ||
          restaurant.tags.some((tag) => tag.toLowerCase().includes("voucher"))
        );
      default:
        return true;
    }
  });
}

export function sortRestaurantsForBrowse(params: {
  restaurants: Restaurant[];
  latitude: number;
  longitude: number;
  sort: RestaurantBrowseSort;
}) {
  if (params.sort === "lowest-price") {
    return [...params.restaurants].sort(
      (a, b) => a.startingPrice - b.startingPrice,
    );
  }

  if (params.sort === "highest-rating") {
    return [...params.restaurants].sort((a, b) => b.rating - a.rating);
  }

  return sortRestaurantsByDistance(params);
}

export function getNearbyRestaurants(params: {
  restaurants: Restaurant[];
  latitude: number;
  longitude: number;
  radiusKm?: number;
}) {
  const radiusKm = params.radiusKm ?? 3;

  return sortRestaurantsByDistance(params).filter(
    (restaurant) =>
      getRestaurantDistanceKm({
        restaurant,
        latitude: params.latitude,
        longitude: params.longitude,
      }) <= radiusKm,
  );
}

export function applyRestaurantBrowse(params: {
  restaurants: Restaurant[];
  latitude: number;
  longitude: number;
  filter: RestaurantBrowseFilter;
  sort: RestaurantBrowseSort;
}) {
  const filtered = filterRestaurants({
    restaurants: params.restaurants,
    filter: params.filter,
  });

  return sortRestaurantsForBrowse({
    restaurants: filtered,
    latitude: params.latitude,
    longitude: params.longitude,
    sort: params.sort,
  });
}

export function getFeaturedRestaurants(params: {
  restaurants: Restaurant[];
  latitude: number;
  longitude: number;
  limit?: number;
}) {
  const limit = params.limit ?? 8;

  return sortRestaurantsByDistance(params)
    .filter((restaurant) => restaurant.featured)
    .slice(0, limit);
}

export function getVoucherRestaurants(params: {
  restaurants: Restaurant[];
  latitude: number;
  longitude: number;
  limit?: number;
}) {
  const limit = params.limit ?? 8;

  return sortRestaurantsByDistance(params)
    .filter((restaurant) => Boolean(restaurant.voucher))
    .slice(0, limit);
}
