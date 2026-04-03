const { AppError } = require("../../common/utils/app-error");
const { Restaurant } = require("./restaurant.model");

function toRestaurantKey(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function toEntityKey(value, fallback) {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base || `${fallback}-${Date.now()}`;
}

async function generateRestaurantKey(name) {
  const baseKey = toRestaurantKey(name) || `restaurant-${Date.now()}`;
  let candidate = baseKey;
  let suffix = 1;

  while (await Restaurant.exists({ key: candidate })) {
    suffix += 1;
    candidate = `${baseKey}-${suffix}`;
  }

  return candidate;
}

function buildRegexCondition(fields, value) {
  return {
    $or: fields.map((field) => {
      if (field.endsWith("[]")) {
        return {
          [field.slice(0, -2)]: {
            $elemMatch: { $regex: value, $options: "i" },
          },
        };
      }

      return {
        [field]: {
          $regex: value,
          $options: "i",
        },
      };
    }),
  };
}

function normalizePrepWindow({
  minMinutes,
  maxMinutes,
  fallbackMin = 15,
  fallbackMax = 20,
}) {
  const hasMin = minMinutes !== undefined && minMinutes !== null && minMinutes !== "";
  const hasMax = maxMinutes !== undefined && maxMinutes !== null && maxMinutes !== "";
  const nextMin = hasMin ? Number(minMinutes) : Number(fallbackMin);
  const nextMax = hasMax ? Number(maxMinutes) : Number(fallbackMax);

  if (!Number.isFinite(nextMin) || nextMin < 1) {
    throw new AppError("Minimum prep time must be at least 1 minute", 400);
  }

  if (!Number.isFinite(nextMax) || nextMax < 1) {
    throw new AppError("Maximum prep time must be at least 1 minute", 400);
  }

  if (nextMin > nextMax) {
    throw new AppError("Maximum prep time must be greater than or equal to minimum prep time", 400);
  }

  return {
    minMinutes: Math.round(nextMin),
    maxMinutes: Math.round(nextMax),
  };
}

function getGeoOptions(query) {
  const latitude = Number(query.lat);
  const longitude = Number(query.lng);
  const radiusKm = Number(query.radiusKm || 0);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude === 0 ||
    longitude === 0
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    maxDistance: radiusKm > 0 ? radiusKm * 1000 : undefined,
  };
}

function buildRestaurantFilter(query, options = {}) {
  const baseFilter = { isActive: true };
  const conditions = [];

  if (query.featured === "true") {
    conditions.push({ featured: true });
  }

  if (query.offers === "true" || query.filter === "offers") {
    conditions.push({ "offers.0": { $exists: true } });
  }

  if (query.category) {
    conditions.push(
      buildRegexCondition(
        ["cuisine", "cuisineTags[]", "tags[]", "menuItems.category"],
        query.category,
      ),
    );
  }

  if (query.q) {
    conditions.push(
      buildRegexCondition(
        [
          "name",
          "cuisine",
          "cuisineTags[]",
          "tags[]",
          "menuItems.name",
          "menuItems.category",
        ],
        query.q,
      ),
    );
  }

  if (query.filter === "rating-3") {
    conditions.push({ rating: { $gte: 3 } });
  }

  if (query.filter === "rating-4") {
    conditions.push({ rating: { $gte: 4 } });
  }

  if (query.filter === "under-30") {
    conditions.push({ deliveryMaxMinutes: { $lte: 30 } });
  }

  if (!options.omitGeo) {
    const geoOptions = getGeoOptions(query);

    if (geoOptions?.maxDistance && query.sort && query.sort !== "nearest") {
      conditions.push({
        location: {
          $geoWithin: {
            $centerSphere: [
              [geoOptions.longitude, geoOptions.latitude],
              geoOptions.maxDistance / 1000 / 6371,
            ],
          },
        },
      });
    }
  }

  if (conditions.length === 0) {
    return baseFilter;
  }

  return {
    $and: [baseFilter, ...conditions],
  };
}

function buildSort(query) {
  switch (query.sort) {
    case "highest-rating":
    case "rating":
      return { rating: -1, createdAt: -1 };
    case "lowest-price":
    case "price-low":
      return { startingPrice: 1, createdAt: -1 };
    case "nearest":
      return null;
    default:
      return { featured: -1, rating: -1, createdAt: -1 };
  }
}

async function listRestaurants(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 50);
  const skip = (page - 1) * limit;

  const filter = buildRestaurantFilter(query);
  const sort = buildSort(query);
  const geoOptions = getGeoOptions(query);

  if (geoOptions) {
    const sortStage = sort ? [{ $sort: sort }] : [];
    const aggregateResult = await Restaurant.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [geoOptions.longitude, geoOptions.latitude],
          },
          distanceField: "distanceMeters",
          spherical: true,
          ...(geoOptions.maxDistance
            ? {
                maxDistance: geoOptions.maxDistance,
              }
            : {}),
          query: buildRestaurantFilter(query, { omitGeo: true }),
        },
      },
      ...sortStage,
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                menuItems: 0,
                menuCategories: 0,
              },
            },
          ],
          totalCount: [{ $count: "total" }],
        },
      },
    ]);

    const items = aggregateResult[0]?.items ?? [];
    const total = aggregateResult[0]?.totalCount?.[0]?.total ?? 0;

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const [items, total] = await Promise.all([
    Restaurant.find(filter)
      .select("-menuItems -menuCategories")
      .sort(sort || undefined)
      .skip(skip)
      .limit(limit)
      .lean(),
    Restaurant.countDocuments(filter),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getRestaurantDetails(restaurantId) {
  const restaurant = await Restaurant.findOne({
    _id: restaurantId,
    isActive: true,
  }).lean();

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  return restaurant;
}

async function getRestaurantMenu(restaurantId) {
  const restaurant = await Restaurant.findOne({
    _id: restaurantId,
    isActive: true,
  })
    .select("key name menuCategories menuItems")
    .lean();

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  return restaurant;
}

async function getOwnedRestaurant(ownerId) {
  const restaurant = await Restaurant.findOne({
    ownerId,
  }).lean();

  if (!restaurant) {
    throw new AppError("No restaurant found for this owner", 404);
  }

  return restaurant;
}

async function getOwnedRestaurantDocument(ownerId) {
  const restaurant = await Restaurant.findOne({ ownerId });

  if (!restaurant) {
    throw new AppError("No restaurant found for this owner", 404);
  }

  return restaurant;
}

async function createRestaurant(ownerId, payload) {
  const existingRestaurant = await Restaurant.exists({ ownerId });
  if (existingRestaurant) {
    throw new AppError("This restaurant owner already has a restaurant", 409);
  }

  const name = payload.name?.trim();
  const cuisine = payload.cuisine?.trim();
  const address = payload.address?.trim();
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);

  if (!name || name.length < 2) {
    throw new AppError("Restaurant name must be at least 2 characters", 400);
  }

  if (!cuisine) {
    throw new AppError("Cuisine is required", 400);
  }

  if (!address) {
    throw new AppError("Restaurant address is required", 400);
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new AppError("Restaurant coordinates are required", 400);
  }

  const prepWindow = normalizePrepWindow({
    minMinutes: payload.defaultPrepMinMinutes,
    maxMinutes: payload.defaultPrepMaxMinutes,
    fallbackMin: 15,
    fallbackMax: 20,
  });

  const restaurant = await Restaurant.create({
    ownerId,
    key: await generateRestaurantKey(name),
    name,
    cuisine,
    cuisineTags: payload.cuisineTags ?? [cuisine],
    address,
    location: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    accent: payload.accent || "#FFC857",
    icon: payload.icon || "restaurant-outline",
    coverImage: payload.coverImage || "",
    logoImage: payload.logoImage || "",
    heroTitle: payload.heroTitle?.trim() || `Fresh ${cuisine} near you`,
    heroSubtitle:
      payload.heroSubtitle?.trim() ||
      "Open your restaurant dashboard to add menu, offers, and delivery settings.",
    priceLevel: payload.priceLevel?.trim() || "$$",
    tags: payload.tags ?? [],
    menuCategories: payload.menuCategories ?? [],
    menuItems: payload.menuItems ?? [],
    offers: payload.offers ?? [],
    featured: false,
    isActive: true,
    startingPrice: Number(payload.startingPrice || 0),
    deliveryTime: payload.deliveryTime?.trim() || "30-40 min",
    deliveryMinMinutes: Number(payload.deliveryMinMinutes || 30),
    deliveryMaxMinutes: Number(payload.deliveryMaxMinutes || 40),
    defaultPrepMinMinutes: prepWindow.minMinutes,
    defaultPrepMaxMinutes: prepWindow.maxMinutes,
  });

  return restaurant.toObject();
}

async function updateOwnedRestaurant(ownerId, payload) {
  const restaurant = await getOwnedRestaurantDocument(ownerId);

  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(payload, key);

  if (hasOwn("name")) {
    const name = payload.name?.trim();
    if (!name || name.length < 2) {
      throw new AppError("Restaurant name must be at least 2 characters", 400);
    }
    restaurant.name = name;
  }

  if (hasOwn("cuisine")) {
    const cuisine = payload.cuisine?.trim();
    if (!cuisine) {
      throw new AppError("Cuisine is required", 400);
    }
    restaurant.cuisine = cuisine;
    restaurant.cuisineTags =
      Array.isArray(payload.cuisineTags) && payload.cuisineTags.length > 0
        ? payload.cuisineTags.map((value) => String(value).trim()).filter(Boolean)
        : [cuisine];
  }

  if (hasOwn("address")) {
    const address = payload.address?.trim();
    if (!address) {
      throw new AppError("Restaurant address is required", 400);
    }
    restaurant.address = address;
  }

  if (hasOwn("heroTitle")) {
    restaurant.heroTitle = payload.heroTitle?.trim() || "";
  }

  if (hasOwn("heroSubtitle")) {
    restaurant.heroSubtitle = payload.heroSubtitle?.trim() || "";
  }

  if (hasOwn("coverImage")) {
    restaurant.coverImage = payload.coverImage?.trim() || "";
  }

  if (hasOwn("logoImage")) {
    restaurant.logoImage = payload.logoImage?.trim() || "";
  }

  if (hasOwn("priceLevel")) {
    restaurant.priceLevel = payload.priceLevel?.trim() || "$$";
  }

  if (hasOwn("defaultPrepMinMinutes") || hasOwn("defaultPrepMaxMinutes")) {
    const prepWindow = normalizePrepWindow({
      minMinutes: payload.defaultPrepMinMinutes,
      maxMinutes: payload.defaultPrepMaxMinutes,
      fallbackMin: restaurant.defaultPrepMinMinutes,
      fallbackMax: restaurant.defaultPrepMaxMinutes,
    });

    restaurant.defaultPrepMinMinutes = prepWindow.minMinutes;
    restaurant.defaultPrepMaxMinutes = prepWindow.maxMinutes;
  }

  if (Array.isArray(payload.tags)) {
    restaurant.tags = payload.tags
      .map((value) => String(value).trim())
      .filter(Boolean);
  }

  await restaurant.save();
  return restaurant.toObject();
}

async function getOwnedRestaurantMenu(ownerId) {
  const restaurant = await getOwnedRestaurantDocument(ownerId);

  return {
    restaurantId: String(restaurant._id),
    restaurantName: restaurant.name,
    menuCategories: restaurant.menuCategories ?? [],
    menuItems: restaurant.menuItems ?? [],
  };
}

async function createMenuCategory(ownerId, payload) {
  const restaurant = await getOwnedRestaurantDocument(ownerId);
  const label = payload.label?.trim();

  if (!label || label.length < 2) {
    throw new AppError("Category label must be at least 2 characters", 400);
  }

  const nextKey = toEntityKey(label, "category");
  const duplicate = restaurant.menuCategories.some(
    (category) => category.key === nextKey || category.label.toLowerCase() === label.toLowerCase(),
  );

  if (duplicate) {
    throw new AppError("This category already exists", 409);
  }

  restaurant.menuCategories.push({
    key: nextKey,
    label,
    sortOrder:
      payload.sortOrder !== undefined
        ? Number(payload.sortOrder)
        : restaurant.menuCategories.length,
  });

  await restaurant.save();

  return {
    restaurantId: String(restaurant._id),
    menuCategories: restaurant.menuCategories,
  };
}

async function getOwnedRestaurantOffers(ownerId) {
  const restaurant = await getOwnedRestaurantDocument(ownerId);

  return {
    restaurantId: String(restaurant._id),
    restaurantName: restaurant.name,
    offers: restaurant.offers ?? [],
  };
}

function normalizeMenuItemPayload(payload, existingKey) {
  const name = payload.name?.trim();
  const description = payload.description?.trim() || "";
  const price = Number(payload.price);
  const category = payload.category?.trim() || "";
  const accent = payload.accent?.trim() || "#FFC857";
  const icon = payload.icon?.trim() || "restaurant-outline";
  const popular = Boolean(payload.popular);
  const isActive = payload.isActive !== undefined ? Boolean(payload.isActive) : true;

  if (!name || name.length < 2) {
    throw new AppError("Item name must be at least 2 characters", 400);
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new AppError("Item price is invalid", 400);
  }

  return {
    key: existingKey || toEntityKey(name, "item"),
    name,
    description,
    price,
    category,
    accent,
    icon,
    popular,
    isActive,
  };
}

function normalizeChoicePayload(choice, fallbackPrefix) {
  const label = choice?.label?.trim();
  const priceModifier = Number(choice?.priceModifier || 0);

  if (!label) {
    throw new AppError("Each option choice needs a label", 400);
  }

  if (!Number.isFinite(priceModifier) || priceModifier < 0) {
    throw new AppError("Option choice price modifier is invalid", 400);
  }

  return {
    id: choice?.id?.trim() || toEntityKey(label, fallbackPrefix),
    label,
    priceModifier,
  };
}

function normalizeOptionGroups(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((group, index) => {
      const title = group?.title?.trim();
      const minSelect = Number(group?.minSelect ?? 0);
      const maxSelect = Number(group?.maxSelect ?? 1);
      const required = Boolean(group?.required);

      if (!title) {
        throw new AppError("Each option group needs a title", 400);
      }

      if (!Number.isFinite(minSelect) || minSelect < 0) {
        throw new AppError("Option group min select is invalid", 400);
      }

      if (!Number.isFinite(maxSelect) || maxSelect < 1) {
        throw new AppError("Option group max select is invalid", 400);
      }

      if (minSelect > maxSelect) {
        throw new AppError("Option group min select can not exceed max select", 400);
      }

      const choices = Array.isArray(group?.choices)
        ? group.choices.map((choice, choiceIndex) =>
            normalizeChoicePayload(choice, `choice-${index + 1}-${choiceIndex + 1}`),
          )
        : [];

      if (!choices.length) {
        throw new AppError("Each option group needs at least one choice", 400);
      }

      return {
        id: group?.id?.trim() || toEntityKey(title, `option-group-${index + 1}`),
        title,
        required,
        minSelect: Math.round(minSelect),
        maxSelect: Math.round(maxSelect),
        choices,
      };
    })
    .filter(Boolean);
}

function normalizeAddonItems(payload, fallbackPrefix) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item, index) => {
    const label = item?.label?.trim();
    const priceModifier = Number(item?.priceModifier || 0);

    if (!label) {
      throw new AppError("Each add-on item needs a label", 400);
    }

    if (!Number.isFinite(priceModifier) || priceModifier < 0) {
      throw new AppError("Add-on item price modifier is invalid", 400);
    }

    return {
      id: item?.id?.trim() || toEntityKey(label, `${fallbackPrefix}-${index + 1}`),
      label,
      priceModifier,
      popular: Boolean(item?.popular),
    };
  });
}

function normalizeAddonGroups(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((group, index) => {
      const title = group?.title?.trim();
      const maxSelect = Number(group?.maxSelect ?? 1);

      if (!title) {
        throw new AppError("Each add-on group needs a title", 400);
      }

      if (!Number.isFinite(maxSelect) || maxSelect < 1) {
        throw new AppError("Add-on group max select is invalid", 400);
      }

      const items = normalizeAddonItems(group?.items, `addon-item-${index + 1}`);

      if (!items.length) {
        throw new AppError("Each add-on group needs at least one add-on item", 400);
      }

      return {
        id: group?.id?.trim() || toEntityKey(title, `addon-group-${index + 1}`),
        title,
        maxSelect: Math.round(maxSelect),
        optionalLabel: group?.optionalLabel?.trim() || "",
        description: group?.description?.trim() || "",
        items,
      };
    })
    .filter(Boolean);
}

function normalizeBundleSuggestions(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item, index) => {
      const label = item?.label?.trim();
      const priceModifier = Number(item?.priceModifier || 0);

      if (!label) {
        throw new AppError("Each bundle suggestion needs a label", 400);
      }

      if (!Number.isFinite(priceModifier) || priceModifier < 0) {
        throw new AppError("Bundle suggestion price modifier is invalid", 400);
      }

      return {
        id: item?.id?.trim() || toEntityKey(label, `bundle-${index + 1}`),
        label,
        priceModifier,
        accent: item?.accent?.trim() || "#FFC857",
        icon: item?.icon?.trim() || "sparkles-outline",
      };
    })
    .filter(Boolean);
}

function normalizeMenuItemDetail(payload) {
  if (!payload) {
    return {
      image: "",
      subtitle: "",
      addonGroups: [],
      bundleSuggestions: [],
      instructionsPlaceholder: "",
      maxInstructionsLength: 500,
    };
  }

  const maxInstructionsLength = Number(payload.maxInstructionsLength ?? 500);

  if (!Number.isFinite(maxInstructionsLength) || maxInstructionsLength < 0) {
    throw new AppError("Instructions length is invalid", 400);
  }

  return {
    image: payload.image?.trim() || "",
    subtitle: payload.subtitle?.trim() || "",
    addonGroups: normalizeAddonGroups(payload.addonGroups),
    bundleSuggestions: normalizeBundleSuggestions(payload.bundleSuggestions),
    instructionsPlaceholder: payload.instructionsPlaceholder?.trim() || "",
    maxInstructionsLength: Math.round(maxInstructionsLength),
  };
}

async function createMenuItem(ownerId, payload) {
  const restaurant = await getOwnedRestaurantDocument(ownerId);
  const nextItem = normalizeMenuItemPayload(payload);
  const optionGroups = normalizeOptionGroups(payload.optionGroups);
  const detail = normalizeMenuItemDetail(payload.detail);

  const duplicate = restaurant.menuItems.some(
    (item) => item.key === nextItem.key || item.name.toLowerCase() === nextItem.name.toLowerCase(),
  );

  if (duplicate) {
    throw new AppError("This menu item already exists", 409);
  }

  if (
    nextItem.category &&
    !restaurant.menuCategories.some((category) => category.key === nextItem.category)
  ) {
    throw new AppError("Selected category does not exist", 400);
  }

  restaurant.menuItems.push({
    ...nextItem,
    optionGroups,
    detail,
  });

  if (
    !restaurant.startingPrice ||
    nextItem.price < restaurant.startingPrice
  ) {
    restaurant.startingPrice = nextItem.price;
  }

  await restaurant.save();

  return {
    restaurantId: String(restaurant._id),
    menuItems: restaurant.menuItems,
  };
}

async function updateMenuItem(ownerId, itemKey, payload) {
  const restaurant = await getOwnedRestaurantDocument(ownerId);
  const targetItem = restaurant.menuItems.find((item) => item.key === itemKey);

  if (!targetItem) {
    throw new AppError("Menu item not found", 404);
  }

  const nextItem = normalizeMenuItemPayload(payload, targetItem.key);
  const optionGroups = normalizeOptionGroups(payload.optionGroups);
  const detail = normalizeMenuItemDetail(payload.detail);

  if (
    nextItem.category &&
    !restaurant.menuCategories.some((category) => category.key === nextItem.category)
  ) {
    throw new AppError("Selected category does not exist", 400);
  }

  targetItem.name = nextItem.name;
  targetItem.description = nextItem.description;
  targetItem.price = nextItem.price;
  targetItem.category = nextItem.category;
  targetItem.accent = nextItem.accent;
  targetItem.icon = nextItem.icon;
  targetItem.popular = nextItem.popular;
  targetItem.isActive = nextItem.isActive;
  targetItem.optionGroups = optionGroups;
  targetItem.detail = detail;

  restaurant.startingPrice =
    restaurant.menuItems.length > 0
      ? Math.min(...restaurant.menuItems.map((item) => Number(item.price) || 0))
      : 0;

  await restaurant.save();

  return {
    restaurantId: String(restaurant._id),
    menuItems: restaurant.menuItems,
  };
}

async function toggleMenuItemStatus(ownerId, itemKey, payload) {
  const restaurant = await getOwnedRestaurantDocument(ownerId);
  const targetItem = restaurant.menuItems.find((item) => item.key === itemKey);

  if (!targetItem) {
    throw new AppError("Menu item not found", 404);
  }

  targetItem.isActive = Boolean(payload.isActive);
  await restaurant.save();

  return {
    restaurantId: String(restaurant._id),
    menuItems: restaurant.menuItems,
  };
}

async function deleteMenuItem(ownerId, itemKey) {
  const restaurant = await getOwnedRestaurantDocument(ownerId);
  const nextMenuItems = restaurant.menuItems.filter((item) => item.key !== itemKey);

  if (nextMenuItems.length === restaurant.menuItems.length) {
    throw new AppError("Menu item not found", 404);
  }

  restaurant.menuItems = nextMenuItems;
  restaurant.startingPrice =
    nextMenuItems.length > 0
      ? Math.min(...nextMenuItems.map((item) => Number(item.price) || 0))
      : 0;

  await restaurant.save();

  return {
    restaurantId: String(restaurant._id),
    menuItems: restaurant.menuItems,
  };
}

function normalizeOfferPayload(payload, existingId) {
  const type = payload.type?.trim();
  const title = payload.title?.trim();
  const shortLabel = payload.shortLabel?.trim() || "";
  const description = payload.description?.trim() || "";
  const minOrderTk = Number(payload.minOrderTk || 0);
  const rawCode = payload.code?.trim().toUpperCase() || "";
  const rawDiscountTk = Number(payload.discountTk || 0);
  const rawDiscountPercent = Number(payload.discountPercent || 0);
  const rawMaxDiscountTk = Number(payload.maxDiscountTk || 0);
  const rawIsAutoApply = Boolean(payload.isAutoApply);
  const rawFreeDelivery = Boolean(payload.freeDelivery);
  const isActive = payload.isActive !== undefined ? Boolean(payload.isActive) : true;

  const allowedTypes = [
    "voucher",
    "threshold_discount",
    "free_delivery",
    "flat_discount",
    "percentage_discount",
    "item_discount",
    "category_discount",
    "buy_x_get_y",
  ];

  if (!allowedTypes.includes(type)) {
    throw new AppError("Offer type is invalid", 400);
  }

  if (!title || title.length < 2) {
    throw new AppError("Offer title must be at least 2 characters", 400);
  }

  if (!Number.isFinite(minOrderTk) || minOrderTk < 0) {
    throw new AppError("Minimum order amount is invalid", 400);
  }

  if (!Number.isFinite(rawDiscountTk) || rawDiscountTk < 0) {
    throw new AppError("Discount amount is invalid", 400);
  }

  if (!Number.isFinite(rawDiscountPercent) || rawDiscountPercent < 0) {
    throw new AppError("Discount percent is invalid", 400);
  }

  if (!Number.isFinite(rawMaxDiscountTk) || rawMaxDiscountTk < 0) {
    throw new AppError("Max discount is invalid", 400);
  }

  let code = rawCode;
  let discountTk = rawDiscountTk;
  let discountPercent = rawDiscountPercent;
  let maxDiscountTk = rawMaxDiscountTk;
  let isAutoApply = rawIsAutoApply;
  let freeDelivery = rawFreeDelivery;

  if (type === "threshold_discount") {
    code = "";
    discountPercent = 0;
    maxDiscountTk = 0;
    freeDelivery = false;
    isAutoApply = true;
  }

  if (type === "flat_discount") {
    discountPercent = 0;
    maxDiscountTk = 0;
    freeDelivery = false;
  }

  if (type === "free_delivery") {
    code = "";
    discountTk = 0;
    discountPercent = 0;
    maxDiscountTk = 0;
    freeDelivery = true;
    isAutoApply = true;
  }

  if (type === "percentage_discount") {
    discountTk = 0;
    freeDelivery = false;
  }

  if (type === "voucher") {
    freeDelivery = false;
  }

  if (
    ["voucher", "flat_discount", "threshold_discount"].includes(type) &&
    discountTk <= 0 &&
    !freeDelivery
  ) {
    throw new AppError("This offer needs a valid flat discount amount", 400);
  }

  if (type === "percentage_discount" && discountPercent <= 0) {
    throw new AppError("Percentage offers need a valid discount percent", 400);
  }

  if (type === "free_delivery" && !freeDelivery) {
    throw new AppError("Free delivery offer must enable freeDelivery", 400);
  }

  if (type === "percentage_discount" && maxDiscountTk <= 0) {
    throw new AppError("Percentage offers need a max discount cap", 400);
  }

  return {
    id: existingId || toEntityKey(code || title, "offer"),
    type,
    title,
    shortLabel,
    description,
    code,
    minOrderTk,
    discountTk,
    discountPercent,
    maxDiscountTk,
    freeDelivery,
    isAutoApply,
    isActive,
    stackable: Boolean(payload.stackable),
    applicableMenuItemKeys: payload.applicableMenuItemKeys ?? [],
    applicableCategoryKeys: payload.applicableCategoryKeys ?? [],
    buyQuantity: Number(payload.buyQuantity || 0),
    getQuantity: Number(payload.getQuantity || 0),
    rewardItemKey: payload.rewardItemKey?.trim() || "",
  };
}

async function createOffer(ownerId, payload) {
  const restaurant = await getOwnedRestaurantDocument(ownerId);
  const nextOffer = normalizeOfferPayload(payload);

  const duplicate = restaurant.offers.some(
    (offer) =>
      offer.id === nextOffer.id ||
      offer.title.toLowerCase() === nextOffer.title.toLowerCase() ||
      (nextOffer.code && offer.code === nextOffer.code),
  );

  if (duplicate) {
    throw new AppError("This offer already exists", 409);
  }

  restaurant.offers.push(nextOffer);
  await restaurant.save();

  return {
    restaurantId: String(restaurant._id),
    offers: restaurant.offers,
  };
}

async function updateOffer(ownerId, offerId, payload) {
  const restaurant = await getOwnedRestaurantDocument(ownerId);
  const targetOffer = restaurant.offers.find((offer) => offer.id === offerId);

  if (!targetOffer) {
    throw new AppError("Offer not found", 404);
  }

  const nextOffer = normalizeOfferPayload(payload, targetOffer.id);

  const duplicate = restaurant.offers.some(
    (offer) =>
      offer.id !== offerId &&
      (offer.title.toLowerCase() === nextOffer.title.toLowerCase() ||
        (nextOffer.code && offer.code === nextOffer.code)),
  );

  if (duplicate) {
    throw new AppError("Another offer already uses this title or code", 409);
  }

  Object.assign(targetOffer, nextOffer);
  await restaurant.save();

  return {
    restaurantId: String(restaurant._id),
    offers: restaurant.offers,
  };
}

async function toggleOfferStatus(ownerId, offerId, payload) {
  const restaurant = await getOwnedRestaurantDocument(ownerId);
  const targetOffer = restaurant.offers.find((offer) => offer.id === offerId);

  if (!targetOffer) {
    throw new AppError("Offer not found", 404);
  }

  targetOffer.isActive = Boolean(payload.isActive);
  await restaurant.save();

  return {
    restaurantId: String(restaurant._id),
    offers: restaurant.offers,
  };
}

async function deleteOffer(ownerId, offerId) {
  const restaurant = await getOwnedRestaurantDocument(ownerId);
  const nextOffers = restaurant.offers.filter((offer) => offer.id !== offerId);

  if (nextOffers.length === restaurant.offers.length) {
    throw new AppError("Offer not found", 404);
  }

  restaurant.offers = nextOffers;
  await restaurant.save();

  return {
    restaurantId: String(restaurant._id),
    offers: restaurant.offers,
  };
}

module.exports = {
  createOffer,
  createMenuCategory,
  createMenuItem,
  createRestaurant,
  deleteOffer,
  deleteMenuItem,
  getOwnedRestaurantOffers,
  getOwnedRestaurantMenu,
  listRestaurants,
  toggleOfferStatus,
  toggleMenuItemStatus,
  getRestaurantDetails,
  getRestaurantMenu,
  getOwnedRestaurant,
  updateOwnedRestaurant,
  updateOffer,
  updateMenuItem,
};
