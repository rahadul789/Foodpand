import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

export type OwnerRestaurant = {
  _id: string;
  ownerId?: string;
  key: string;
  name: string;
  cuisine: string;
  cuisineTags: string[];
  deliveryTime: string;
  deliveryMinMinutes: number;
  deliveryMaxMinutes: number;
  defaultPrepMinMinutes: number;
  defaultPrepMaxMinutes: number;
  rating: number;
  ratingCount: number;
  accent: string;
  icon: string;
  priceLevel: string;
  tags: string[];
  address: string;
  heroTitle: string;
  heroSubtitle: string;
  coverImage: string;
  logoImage: string;
  startingPrice: number;
  featured: boolean;
  isActive: boolean;
  offers: OwnerOffer[];
  menuCategories: Array<{
    key: string;
    label: string;
    sortOrder: number;
  }>;
  menuItems: OwnerMenuItem[];
};

export type OwnerMenuCategory = {
  key: string;
  label: string;
  sortOrder: number;
};

export type OwnerMenuItemOptionChoice = {
  id: string;
  label: string;
  priceModifier: number;
};

export type OwnerMenuItemOptionGroup = {
  id: string;
  title: string;
  required?: boolean;
  minSelect?: number;
  maxSelect?: number;
  choices: OwnerMenuItemOptionChoice[];
};

export type OwnerMenuItemAddonItem = {
  id: string;
  label: string;
  priceModifier: number;
  popular?: boolean;
};

export type OwnerMenuItemAddonGroup = {
  id: string;
  title: string;
  maxSelect?: number;
  optionalLabel?: string;
  description?: string;
  items: OwnerMenuItemAddonItem[];
};

export type OwnerMenuItemBundleSuggestion = {
  id: string;
  label: string;
  priceModifier: number;
  accent?: string;
  icon?: string;
};

export type OwnerMenuItemDetail = {
  image?: string;
  subtitle?: string;
  addonGroups?: OwnerMenuItemAddonGroup[];
  bundleSuggestions?: OwnerMenuItemBundleSuggestion[];
  instructionsPlaceholder?: string;
  maxInstructionsLength?: number;
};

export type OwnerMenuItem = {
  key: string;
  name: string;
  description: string;
  price: number;
  category: string;
  accent?: string;
  icon?: string;
  optionGroups?: OwnerMenuItemOptionGroup[];
  detail?: OwnerMenuItemDetail | null;
  popular?: boolean;
  isActive?: boolean;
};

export type UpsertOwnerMenuItemPayload = {
  name: string;
  description?: string;
  price: number;
  category?: string;
  popular?: boolean;
  isActive?: boolean;
  optionGroups?: OwnerMenuItemOptionGroup[];
  detail?: OwnerMenuItemDetail;
};

export type OwnerMenuResponse = {
  restaurantId: string;
  restaurantName: string;
  menuCategories: OwnerMenuCategory[];
  menuItems: OwnerMenuItem[];
};

export type OwnerOffer = {
  id: string;
  type:
    | "voucher"
    | "threshold_discount"
    | "free_delivery"
    | "flat_discount"
    | "percentage_discount"
    | "item_discount"
    | "category_discount"
    | "buy_x_get_y";
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
};

export type OwnerOffersResponse = {
  restaurantId: string;
  restaurantName: string;
  offers: OwnerOffer[];
};

export type OwnerOrder = {
  id: string;
  orderCode?: string;
  restaurantId: string;
  restaurantName: string;
  restaurantOwnerId?: string;
  restaurantCoverImage?: string;
  status:
    | "Pending acceptance"
    | "Preparing"
    | "Ready for pickup"
    | "On the way"
    | "Delivered"
    | "Cancelled";
  eta: string;
  total: number;
  subtotalTk: number;
  deliveryTk: number;
  serviceFeeTk: number;
  discountTk: number;
  accent: string;
  icon: string;
  items: string[];
  paymentMethod: "COD" | "bKash";
  placedAt: string;
  deliveryAddress: string;
  riderName?: string;
  deliveryPartnerId?: string;
  deliveryAcceptedAt?: string;
  prepareMinMinutes?: number;
  prepareMaxMinutes?: number;
  estimatedReadyAt?: string;
  restaurantAcceptedAt?: string;
  readyForPickupAt?: string;
  statusHistory?: Array<{
    status: OwnerOrder["status"];
    actorRole: "customer" | "restaurant_owner" | "delivery_partner" | "admin";
    note?: string;
    createdAt: string;
  }>;
};

export type UpdateOwnerRestaurantPayload = {
  name?: string;
  cuisine?: string;
  address?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  coverImage?: string;
  logoImage?: string;
  priceLevel?: string;
  tags?: string[];
  defaultPrepMinMinutes?: number;
  defaultPrepMaxMinutes?: number;
};

export type UploadSignatureScope =
  | "restaurant-logo"
  | "restaurant-cover"
  | "menu-item-image";

export type UploadSignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  resourceType: "image";
  signature: string;
  uploadUrl: string;
};

export async function getMyRestaurantRequest(token: string) {
  const response = await apiGet<OwnerRestaurant>("/api/v1/restaurants/mine", token);
  return response.data;
}

export async function createRestaurantRequest(
  token: string,
  payload: {
    name: string;
    cuisine: string;
    address: string;
    latitude: number;
    longitude: number;
  },
) {
  const response = await apiPost<OwnerRestaurant>("/api/v1/restaurants", payload, token);
  return response.data;
}

export async function updateMyRestaurantRequest(
  token: string,
  payload: UpdateOwnerRestaurantPayload,
) {
  const response = await apiPatch<OwnerRestaurant>("/api/v1/restaurants/mine", payload, token);
  return response.data;
}

export async function getOwnerInboxRequest(token: string) {
  const response = await apiGet<OwnerOrder[]>("/api/v1/orders/restaurant/inbox", token);
  return response.data;
}

export async function getMyMenuRequest(token: string) {
  const response = await apiGet<OwnerMenuResponse>("/api/v1/restaurants/mine/menu", token);
  return response.data;
}

export async function createMenuCategoryRequest(
  token: string,
  payload: { label: string; sortOrder?: number },
) {
  const response = await apiPost<{
    restaurantId: string;
    menuCategories: OwnerMenuCategory[];
  }>("/api/v1/restaurants/mine/menu/categories", payload, token);
  return response.data;
}

export async function createMenuItemRequest(
  token: string,
  payload: UpsertOwnerMenuItemPayload,
) {
  const response = await apiPost<{
    restaurantId: string;
    menuItems: OwnerMenuItem[];
  }>("/api/v1/restaurants/mine/menu/items", payload, token);
  return response.data;
}

export async function updateMenuItemRequest(
  token: string,
  itemKey: string,
  payload: UpsertOwnerMenuItemPayload,
) {
  const response = await apiPatch<{
    restaurantId: string;
    menuItems: OwnerMenuItem[];
  }>(`/api/v1/restaurants/mine/menu/items/${itemKey}`, payload, token);
  return response.data;
}

export async function updateMenuItemStatusRequest(
  token: string,
  itemKey: string,
  isActive: boolean,
) {
  const response = await apiPatch<{
    restaurantId: string;
    menuItems: OwnerMenuItem[];
  }>(`/api/v1/restaurants/mine/menu/items/${itemKey}/status`, { isActive }, token);
  return response.data;
}

export async function deleteMenuItemRequest(token: string, itemKey: string) {
  const response = await apiDelete<{
    restaurantId: string;
    menuItems: OwnerMenuItem[];
  }>(`/api/v1/restaurants/mine/menu/items/${itemKey}`, token);
  return response.data;
}

export async function updateOwnerOrderStatusRequest(
  token: string,
  orderId: string,
  payload: {
    status: OwnerOrder["status"];
    note?: string;
    prepareMinMinutes?: number;
    prepareMaxMinutes?: number;
  },
) {
  const response = await apiPatch<OwnerOrder>(
    `/api/v1/orders/${orderId}/status`,
    payload,
    token,
  );
  return response.data;
}

export async function updateOrderPreparationWindowRequest(
  token: string,
  orderId: string,
  payload: {
    prepareMinMinutes: number;
    prepareMaxMinutes: number;
    note?: string;
  },
) {
  const response = await apiPatch<OwnerOrder>(
    `/api/v1/orders/${orderId}/preparation-window`,
    payload,
    token,
  );
  return response.data;
}

export async function getMyOffersRequest(token: string) {
  const response = await apiGet<OwnerOffersResponse>("/api/v1/restaurants/mine/offers", token);
  return response.data;
}

export async function createOfferRequest(
  token: string,
  payload: Omit<OwnerOffer, "id">,
) {
  const response = await apiPost<{
    restaurantId: string;
    offers: OwnerOffer[];
  }>("/api/v1/restaurants/mine/offers", payload, token);
  return response.data;
}

export async function updateOfferRequest(
  token: string,
  offerId: string,
  payload: Omit<OwnerOffer, "id">,
) {
  const response = await apiPatch<{
    restaurantId: string;
    offers: OwnerOffer[];
  }>(`/api/v1/restaurants/mine/offers/${offerId}`, payload, token);
  return response.data;
}

export async function updateOfferStatusRequest(
  token: string,
  offerId: string,
  isActive: boolean,
) {
  const response = await apiPatch<{
    restaurantId: string;
    offers: OwnerOffer[];
  }>(`/api/v1/restaurants/mine/offers/${offerId}/status`, { isActive }, token);
  return response.data;
}

export async function deleteOfferRequest(token: string, offerId: string) {
  const response = await apiDelete<{
    restaurantId: string;
    offers: OwnerOffer[];
  }>(`/api/v1/restaurants/mine/offers/${offerId}`, token);
  return response.data;
}

export async function createUploadSignatureRequest(
  token: string,
  payload: {
    scope: UploadSignatureScope;
    entityId?: string;
  },
) {
  const response = await apiPost<UploadSignatureResponse>(
    "/api/v1/uploads/signature",
    payload,
    token,
  );
  return response.data;
}
