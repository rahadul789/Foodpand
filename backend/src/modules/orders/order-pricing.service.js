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
};
