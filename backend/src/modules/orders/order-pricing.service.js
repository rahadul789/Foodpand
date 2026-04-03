const { AppError } = require("../../common/utils/app-error");

const DELIVERY_FEE_TK = 40;
const SERVICE_FEE_TK = 20;

const GLOBAL_COUPON_OFFERS = {
  YUMMELA: {
    type: "flat_discount",
    title: "YUMMELA",
    shortLabel: "TK 50 off",
    code: "YUMMELA",
    minOrderTk: 199,
    discountTk: 50,
    isAutoApply: false,
    isActive: true,
    stackable: false,
  },
  FREEDEL: {
    type: "free_delivery",
    title: "FREEDEL",
    shortLabel: "Free delivery",
    code: "FREEDEL",
    minOrderTk: 0,
    freeDelivery: true,
    isAutoApply: false,
    isActive: true,
    stackable: false,
  },
};

function roundTk(value) {
  return Math.max(Math.round(Number(value) || 0), 0);
}

function uniqueStrings(values) {
  return [...new Set((values ?? []).map((value) => String(value).trim()).filter(Boolean))];
}

function normalizeSelectedOptions(rawSelectedOptions, menuItem) {
  const optionGroups = Array.isArray(menuItem.optionGroups) ? menuItem.optionGroups : [];
  const selectedOptions = Array.isArray(rawSelectedOptions) ? rawSelectedOptions : [];
  const selectedMap = new Map();

  selectedOptions.forEach((entry) => {
    const groupId = entry?.groupId?.trim();
    const choiceId = entry?.choiceId?.trim();
    if (!groupId || !choiceId) {
      throw new AppError("One or more option selections are invalid.", 400);
    }
    selectedMap.set(groupId, choiceId);
  });

  let extraTk = 0;
  const normalizedSelections = [];

  optionGroups.forEach((group) => {
    const choiceId = selectedMap.get(group.id);
    const requiresSelection = Boolean(group.required) || Number(group.minSelect || 0) > 0;

    if (!choiceId) {
      if (requiresSelection) {
        throw new AppError(`Please choose an option for ${group.title}.`, 400);
      }
      return;
    }

    const choice = (group.choices ?? []).find((entry) => entry.id === choiceId);
    if (!choice) {
      throw new AppError(`Selected option for ${group.title} is unavailable.`, 400);
    }

    extraTk += roundTk(choice.priceModifier);
    normalizedSelections.push({
      groupId: group.id,
      choiceId: choice.id,
    });
  });

  selectedMap.forEach((_choiceId, groupId) => {
    if (!optionGroups.some((group) => group.id === groupId)) {
      throw new AppError("One or more option groups are invalid.", 400);
    }
  });

  return {
    extraTk,
    selectedOptions: normalizedSelections,
  };
}

function normalizeSelectedAddons(rawSelectedAddons, menuItem) {
  const addonGroups =
    Array.isArray(menuItem.detail?.addonGroups) ? menuItem.detail.addonGroups : [];
  const selectedAddonGroups = Array.isArray(rawSelectedAddons) ? rawSelectedAddons : [];

  let extraTk = 0;
  const normalizedSelections = selectedAddonGroups.map((entry) => {
    const groupId = entry?.groupId?.trim();
    if (!groupId) {
      throw new AppError("One or more add-on groups are invalid.", 400);
    }

    const addonGroup = addonGroups.find((group) => group.id === groupId);
    if (!addonGroup) {
      throw new AppError("One or more add-on groups are invalid.", 400);
    }

    const itemIds = uniqueStrings(entry?.itemIds);
    if (addonGroup.maxSelect && itemIds.length > addonGroup.maxSelect) {
      throw new AppError(`You can select up to ${addonGroup.maxSelect} add-ons in ${addonGroup.title}.`, 400);
    }

    itemIds.forEach((itemId) => {
      const addonItem = (addonGroup.items ?? []).find((item) => item.id === itemId);
      if (!addonItem) {
        throw new AppError(`One or more add-ons in ${addonGroup.title} are unavailable.`, 400);
      }
      extraTk += roundTk(addonItem.priceModifier);
    });

    return {
      groupId: addonGroup.id,
      itemIds,
    };
  });

  return {
    extraTk,
    selectedAddons: normalizedSelections,
  };
}

function normalizeSelectedBundles(rawSelectedBundleSuggestionIds, menuItem) {
  const bundleSuggestions =
    Array.isArray(menuItem.detail?.bundleSuggestions) ? menuItem.detail.bundleSuggestions : [];
  const selectedBundleSuggestionIds = uniqueStrings(rawSelectedBundleSuggestionIds);

  let extraTk = 0;
  selectedBundleSuggestionIds.forEach((suggestionId) => {
    const suggestion = bundleSuggestions.find((item) => item.id === suggestionId);
    if (!suggestion) {
      throw new AppError("One or more suggested pairings are unavailable.", 400);
    }
    extraTk += roundTk(suggestion.priceModifier);
  });

  return {
    extraTk,
    selectedBundleSuggestionIds,
  };
}

function normalizeLineItemsWithPricing(lineItems, restaurant) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new AppError("Add at least one item before placing the order", 400);
  }

  const menuMap = new Map((restaurant.menuItems ?? []).map((item) => [item.key, item]));

  return lineItems.map((item) => {
    const quantity = Number(item.quantity);
    const restaurantMenuItem = menuMap.get(item.itemId);

    if (!restaurantMenuItem) {
      throw new AppError("One or more selected items are unavailable", 400);
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new AppError("Item quantity must be at least 1", 400);
    }

    const normalizedOptions = normalizeSelectedOptions(
      item.configuration?.selectedOptions,
      restaurantMenuItem,
    );
    const normalizedAddons = normalizeSelectedAddons(
      item.configuration?.selectedAddons,
      restaurantMenuItem,
    );
    const normalizedBundles = normalizeSelectedBundles(
      item.configuration?.selectedBundleSuggestionIds,
      restaurantMenuItem,
    );

    const unitTk = roundTk(
      restaurantMenuItem.price +
        normalizedOptions.extraTk +
        normalizedAddons.extraTk +
        normalizedBundles.extraTk,
    );

    return {
      itemId: restaurantMenuItem.key,
      name: restaurantMenuItem.name,
      quantity,
      unitTk,
      summary: item.summary?.trim() || "",
      configuration: {
        selectedOptions: normalizedOptions.selectedOptions,
        selectedAddons: normalizedAddons.selectedAddons,
        selectedBundleSuggestionIds: normalizedBundles.selectedBundleSuggestionIds,
      },
    };
  });
}

function normalizeCouponCode(code) {
  return code?.trim().toUpperCase() || "";
}

function getOfferDiscountTk(offer, subtotalTk, deliveryTk) {
  switch (offer.type) {
    case "threshold_discount":
    case "flat_discount":
      return roundTk(offer.discountTk);
    case "voucher":
    case "percentage_discount": {
      const percent = Number(offer.discountPercent || 0);
      const rawDiscount = Math.floor((subtotalTk * percent) / 100);
      if (offer.maxDiscountTk > 0) {
        return Math.min(rawDiscount, roundTk(offer.maxDiscountTk));
      }
      if (offer.discountTk > 0 && percent === 0) {
        return roundTk(offer.discountTk);
      }
      return roundTk(rawDiscount);
    }
    case "free_delivery":
      return roundTk(deliveryTk);
    default:
      return 0;
  }
}

function isOfferEligible(offer, subtotalTk) {
  if (!offer || offer.isActive === false) {
    return false;
  }

  if (Number(offer.minOrderTk || 0) > subtotalTk) {
    return false;
  }

  return true;
}

function isAutoOffer(offer) {
  return Boolean(
    offer &&
      offer.code === "" &&
      (offer.isAutoApply || offer.type === "threshold_discount"),
  );
}

function toAppliedOffer(offer, discountTk) {
  return {
    type: offer.type,
    title: offer.title,
    shortLabel: offer.shortLabel || "",
    code: offer.code || "",
    discountTk,
    freeDeliveryApplied: offer.type === "free_delivery",
    isAutoApply: Boolean(offer.isAutoApply),
  };
}

function selectBestAutoOffer(offers, subtotalTk, deliveryTk) {
  const candidates = offers
    .filter((offer) => isAutoOffer(offer) && isOfferEligible(offer, subtotalTk))
    .map((offer) => ({
      offer,
      discountTk: getOfferDiscountTk(offer, subtotalTk, deliveryTk),
    }))
    .filter((entry) => entry.discountTk > 0);

  candidates.sort((left, right) => right.discountTk - left.discountTk);
  return candidates[0] ?? null;
}

function getCouponOffer(restaurantOffers, couponCode) {
  if (!couponCode) {
    return null;
  }

  const restaurantMatch = restaurantOffers.find(
    (offer) =>
      offer.code &&
      offer.code.trim().toUpperCase() === couponCode &&
      offer.isActive !== false,
  );

  if (restaurantMatch) {
    return restaurantMatch;
  }

  return GLOBAL_COUPON_OFFERS[couponCode] ?? null;
}

function buildPricingBreakdown({
  restaurant,
  lineItems,
  couponCode,
}) {
  const subtotalTk = roundTk(
    lineItems.reduce((sum, item) => sum + item.quantity * item.unitTk, 0),
  );
  const deliveryTk = DELIVERY_FEE_TK;
  const serviceFeeTk = SERVICE_FEE_TK;
  const normalizedCouponCode = normalizeCouponCode(couponCode);
  const restaurantOffers = (restaurant.offers ?? []).filter(
    (offer) => offer.isActive !== false,
  );

  let appliedOffer = null;
  let discountTk = 0;

  if (normalizedCouponCode) {
    const couponOffer = getCouponOffer(restaurantOffers, normalizedCouponCode);

    if (!couponOffer) {
      throw new AppError("Coupon code is not valid.", 400);
    }

    if (!isOfferEligible(couponOffer, subtotalTk)) {
      throw new AppError("This coupon is not eligible for the current cart.", 400);
    }

    discountTk = getOfferDiscountTk(couponOffer, subtotalTk, deliveryTk);

    if (discountTk <= 0) {
      throw new AppError("This coupon can not be applied right now.", 400);
    }

    appliedOffer = toAppliedOffer(couponOffer, discountTk);
  } else {
    const autoOffer = selectBestAutoOffer(restaurantOffers, subtotalTk, deliveryTk);

    if (autoOffer) {
      discountTk = autoOffer.discountTk;
      appliedOffer = toAppliedOffer(autoOffer.offer, autoOffer.discountTk);
    }
  }

  const totalTk = Math.max(
    subtotalTk + deliveryTk + serviceFeeTk - discountTk,
    0,
  );

  return {
    subtotalTk,
    deliveryTk,
    serviceFeeTk,
    discountTk,
    totalTk,
    couponCode: normalizedCouponCode || null,
    appliedOffer,
  };
}

module.exports = {
  DELIVERY_FEE_TK,
  SERVICE_FEE_TK,
  buildPricingBreakdown,
  normalizeLineItemsWithPricing,
};
