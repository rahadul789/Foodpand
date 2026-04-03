const { Types } = require("mongoose");

const { AppError } = require("../../common/utils/app-error");
const { Restaurant } = require("../restaurants/restaurant.model");
const { User } = require("../users/user.model");
const { Order } = require("./order.model");
const {
  buildPricingBreakdown,
  normalizeLineItemsWithPricing,
} = require("./order-pricing.service");
const {
  emitCustomerOrderChanged,
  emitDeliveryOrdersChanged,
  emitOwnerOrderChanged,
} = require("../../realtime/socket");
const {
  notifyCustomerForOrder,
  notifyDeliveryPartnersForOrder,
  notifyOwnerForOrder,
} = require("../notifications/notification.service");

const ACTIVE_STATUSES = [
  "Pending acceptance",
  "Preparing",
  "Ready for pickup",
  "On the way",
];
const HISTORY_STATUSES = ["Delivered", "Cancelled"];
const DELIVERY_DISPATCH_WINDOW_MS = 20 * 1000;
const DELIVERY_DISPATCH_BATCH_SIZE = 5;
const dispatchRoundTimers = new Map();
const ORDER_STATUSES = [
  "Pending acceptance",
  "Preparing",
  "Ready for pickup",
  "On the way",
  "Delivered",
  "Cancelled",
];
const ALLOWED_TRANSITIONS = {
  customer: {
    "Pending acceptance": ["Cancelled"],
  },
  restaurant_owner: {
    "Pending acceptance": ["Preparing", "Cancelled"],
    Preparing: ["Ready for pickup", "Cancelled"],
  },
  delivery_partner: {
    "Ready for pickup": ["On the way"],
    "On the way": ["Delivered"],
  },
  admin: {
    "Pending acceptance": ["Preparing", "Cancelled"],
    Preparing: ["Ready for pickup", "Cancelled"],
    "Ready for pickup": ["On the way", "Cancelled"],
    "On the way": ["Delivered", "Cancelled"],
  },
};

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

async function generateOrderCode() {
  let orderCode = "";

  do {
    orderCode = `FD-${String(Date.now()).slice(-8)}`;
  } while (await Order.exists({ orderCode }));

  return orderCode;
}

function formatPrepRange(minMinutes, maxMinutes) {
  if (!minMinutes || !maxMinutes) {
    return "Preparing";
  }

  return minMinutes === maxMinutes
    ? `${minMinutes} min`
    : `${minMinutes}-${maxMinutes} min`;
}

function buildPreparingEta(minMinutes, maxMinutes) {
  const rangeLabel = formatPrepRange(minMinutes, maxMinutes);
  return `Preparing - ${rangeLabel}`;
}

function normalizePreparationWindow(payload, restaurant) {
  const hasMin =
    payload.prepareMinMinutes !== undefined &&
    payload.prepareMinMinutes !== null &&
    payload.prepareMinMinutes !== "";
  const hasMax =
    payload.prepareMaxMinutes !== undefined &&
    payload.prepareMaxMinutes !== null &&
    payload.prepareMaxMinutes !== "";

  const minMinutes = hasMin
    ? Number(payload.prepareMinMinutes)
    : Number(restaurant?.defaultPrepMinMinutes || 15);
  const maxMinutes = hasMax
    ? Number(payload.prepareMaxMinutes)
    : Number(restaurant?.defaultPrepMaxMinutes || 20);

  if (!Number.isFinite(minMinutes) || minMinutes < 1) {
    throw new AppError("Minimum prep time must be at least 1 minute", 400);
  }

  if (!Number.isFinite(maxMinutes) || maxMinutes < 1) {
    throw new AppError("Maximum prep time must be at least 1 minute", 400);
  }

  if (minMinutes > maxMinutes) {
    throw new AppError("Maximum prep time must be greater than or equal to minimum prep time", 400);
  }

  return {
    minMinutes: Math.round(minMinutes),
    maxMinutes: Math.round(maxMinutes),
  };
}

function normalizeLiveLocation(payload) {
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  const heading =
    payload.heading !== undefined && payload.heading !== null
      ? Number(payload.heading)
      : null;
  const speed =
    payload.speed !== undefined && payload.speed !== null
      ? Number(payload.speed)
      : null;

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new AppError("Latitude is invalid", 400);
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new AppError("Longitude is invalid", 400);
  }

  if (heading !== null && (!Number.isFinite(heading) || heading < 0 || heading > 360)) {
    throw new AppError("Heading is invalid", 400);
  }

  if (speed !== null && (!Number.isFinite(speed) || speed < 0)) {
    throw new AppError("Speed is invalid", 400);
  }

  return {
    latitude,
    longitude,
    heading,
    speed,
    updatedAt: new Date(),
  };
}

function normalizeDeliveryLocation(payload) {
  const latitude = Number(payload?.latitude);
  const longitude = Number(payload?.longitude);
  const label = payload?.label?.trim() || "";
  const subtitle = payload?.subtitle?.trim() || "";

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new AppError("Delivery latitude is invalid", 400);
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new AppError("Delivery longitude is invalid", 400);
  }

  return {
    latitude,
    longitude,
    label,
    subtitle,
  };
}

function getStatusPresentation(status, restaurant, options = {}) {
  const prepareMinMinutes = options.prepareMinMinutes ?? null;
  const prepareMaxMinutes = options.prepareMaxMinutes ?? null;

  switch (status) {
    case "Preparing":
      return {
        eta: buildPreparingEta(prepareMinMinutes, prepareMaxMinutes),
        canTrack: false,
        icon: "restaurant-outline",
        riderName: "",
      };
    case "Ready for pickup":
      return {
        eta: "Ready for rider pickup",
        canTrack: false,
        icon: "checkmark-circle-outline",
        riderName: "",
      };
    case "On the way":
      return {
        eta: restaurant?.deliveryTime || "On the way",
        canTrack: true,
        icon: "bicycle-outline",
      };
    case "Delivered":
      return {
        eta: "Delivered successfully",
        canTrack: false,
        icon: "checkmark-circle-outline",
      };
    case "Cancelled":
      return {
        eta: "Order was cancelled",
        canTrack: false,
        icon: "close-circle-outline",
        riderName: "",
      };
    case "Pending acceptance":
    default:
      return {
        eta: "Waiting for restaurant",
        canTrack: false,
        icon: "time-outline",
        riderName: "",
      };
  }
}

function validateObjectId(value, message) {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(message, 404);
  }
}

function clearDispatchRoundTimer(orderId) {
  const existing = dispatchRoundTimers.get(String(orderId));

  if (existing) {
    clearTimeout(existing);
    dispatchRoundTimers.delete(String(orderId));
  }
}

function getDispatchRestaurantLocation(restaurant) {
  const [longitude, latitude] = restaurant?.location?.coordinates ?? [];

  if (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    (latitude !== 0 || longitude !== 0)
  ) {
    return { latitude, longitude };
  }

  return null;
}

function getRiderDispatchLocation(rider) {
  const [deviceLongitude, deviceLatitude] =
    rider.currentDeviceLocation?.location?.coordinates ?? [];

  if (
    Number.isFinite(deviceLatitude) &&
    Number.isFinite(deviceLongitude) &&
    (deviceLatitude !== 0 || deviceLongitude !== 0)
  ) {
    return { latitude: deviceLatitude, longitude: deviceLongitude };
  }

  if (
    Number.isFinite(rider.liveDeliveryLocation?.latitude) &&
    Number.isFinite(rider.liveDeliveryLocation?.longitude)
  ) {
    return {
      latitude: rider.liveDeliveryLocation.latitude,
      longitude: rider.liveDeliveryLocation.longitude,
    };
  }

  return null;
}

function haversineMeters(from, to) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371e3;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const startLat = toRadians(from.latitude);
  const endLat = toRadians(to.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(startLat) *
      Math.cos(endLat) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapOrder(order) {
  const fallbackOrderCode =
    order.orderCode || `FD-${String(order._id).slice(-8).toUpperCase()}`;

  return {
    id: String(order._id),
    orderCode: fallbackOrderCode,
    restaurantId: String(order.restaurantId),
    restaurantOwnerId: order.restaurantOwnerId
      ? String(order.restaurantOwnerId)
      : undefined,
    restaurantName: order.restaurantName,
    status: order.status,
    eta: order.eta,
    total: order.totalTk,
    subtotalTk: order.subtotalTk,
    deliveryTk: order.deliveryTk,
    serviceFeeTk: order.serviceFeeTk,
    discountTk: order.discountTk,
    couponCode: order.couponCode || undefined,
    appliedOffer: order.appliedOffer || undefined,
    accent: order.restaurantAccent,
    icon: order.restaurantIcon,
    restaurantCoverImage: order.restaurantCoverImage,
    items: order.items,
    lineItems: (order.lineItems ?? []).map((item) => ({
      id: String(item._id),
      itemId: item.itemId,
      name: item.name,
      quantity: item.quantity,
      unitTk: item.unitTk,
      summary: item.summary || undefined,
      configuration: item.configuration
        ? {
            selectedOptions: item.configuration.selectedOptions ?? [],
            selectedAddons: item.configuration.selectedAddons ?? [],
            selectedBundleSuggestionIds:
              item.configuration.selectedBundleSuggestionIds ?? [],
          }
        : undefined,
    })),
    paymentMethod: order.paymentMethod,
    userId: String(order.userId),
    placedAt: order.placedAt.toISOString(),
    deliveryAddress: order.deliveryAddress,
    deliveryLocation: order.deliveryLocation
      ? {
          label: order.deliveryLocation.label || "",
          subtitle: order.deliveryLocation.subtitle || "",
          latitude: order.deliveryLocation.latitude,
          longitude: order.deliveryLocation.longitude,
        }
      : undefined,
    note: order.note || undefined,
    canTrack: order.canTrack,
    deliveryPartnerId: order.deliveryPartnerId
      ? String(order.deliveryPartnerId)
      : undefined,
    riderName: order.riderName || undefined,
    deliveryTransportMode: order.deliveryTransportMode || undefined,
    deliveryLiveLocation: order.deliveryLiveLocation
      ? {
          latitude: order.deliveryLiveLocation.latitude,
          longitude: order.deliveryLiveLocation.longitude,
          heading:
            typeof order.deliveryLiveLocation.heading === "number"
              ? order.deliveryLiveLocation.heading
              : undefined,
          speed:
            typeof order.deliveryLiveLocation.speed === "number"
              ? order.deliveryLiveLocation.speed
              : undefined,
          updatedAt: order.deliveryLiveLocation.updatedAt?.toISOString(),
        }
      : undefined,
    prepareMinMinutes:
      typeof order.prepareMinMinutes === "number" ? order.prepareMinMinutes : undefined,
    prepareMaxMinutes:
      typeof order.prepareMaxMinutes === "number" ? order.prepareMaxMinutes : undefined,
    estimatedReadyAt: order.estimatedReadyAt?.toISOString(),
    restaurantAcceptedAt: order.restaurantAcceptedAt?.toISOString(),
    readyForPickupAt: order.readyForPickupAt?.toISOString(),
    deliveryAcceptedAt: order.deliveryAcceptedAt?.toISOString(),
    deliveryDispatchRound:
      typeof order.deliveryDispatchRound === "number"
        ? order.deliveryDispatchRound
        : 0,
    deliveryDispatchWindowExpiresAt:
      order.deliveryDispatchWindowExpiresAt?.toISOString(),
    deliveryDispatchExhaustedAt:
      order.deliveryDispatchExhaustedAt?.toISOString(),
    pickedUpAt: order.pickedUpAt?.toISOString(),
    deliveredAt: order.deliveredAt?.toISOString(),
    statusHistory: (order.statusHistory ?? []).map((entry) => ({
      status: entry.status,
      actorRole: entry.actorRole,
      note: entry.note || undefined,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

function normalizeMoney(value, label) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new AppError(`${label} is invalid`, 400);
  }

  return Math.round(number);
}

async function getRestaurantSnapshot(restaurantId) {
  validateObjectId(restaurantId, "Restaurant not found");

  const restaurant = await Restaurant.findOne({
    _id: restaurantId,
    isActive: true,
  })
    .select(
      "_id ownerId name accent icon coverImage deliveryTime menuItems offers isActive location",
    )
    .lean();

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  return restaurant;
}

async function getDeliveryDispatchCandidatesForOrder(order) {
  const restaurant = await Restaurant.findById(order.restaurantId)
    .select("location")
    .lean();

  const restaurantLocation = getDispatchRestaurantLocation(restaurant);
  const excludedIds = (order.deliveryDispatchNotifiedPartnerIds ?? []).map(String);

  const riders = await User.find({
    role: "delivery_partner",
    isActive: true,
    "deliveryAvailability.isOnline": true,
    "deliveryAvailability.acceptsNewOrders": { $ne: false },
    _id: excludedIds.length
      ? {
          $nin: excludedIds,
        }
      : { $exists: true },
    "pushTokens.appId": "delivery-app",
  })
    .select(
      "_id currentDeviceLocation liveDeliveryLocation deliveryAvailability pushTokens",
    )
    .lean();

  if (!riders.length) {
    return [];
  }

  const activeCounts = await Order.aggregate([
    {
      $match: {
        deliveryPartnerId: {
          $in: riders.map((rider) => rider._id),
        },
        status: {
          $in: ["Ready for pickup", "On the way"],
        },
      },
    },
    {
      $group: {
        _id: "$deliveryPartnerId",
        assignedCount: { $sum: 1 },
        liveCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "On the way"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const countMap = new Map(
    activeCounts.map((entry) => [
      String(entry._id),
      {
        assignedCount: entry.assignedCount || 0,
        liveCount: entry.liveCount || 0,
      },
    ]),
  );

  return riders
    .map((rider) => {
      const counts = countMap.get(String(rider._id)) ?? {
        assignedCount: 0,
        liveCount: 0,
      };
      const riderLocation = getRiderDispatchLocation(rider);

      return {
        riderId: String(rider._id),
        liveCount: counts.liveCount,
        assignedCount: counts.assignedCount,
        distanceMeters:
          riderLocation && restaurantLocation
            ? haversineMeters(riderLocation, restaurantLocation)
            : Number.POSITIVE_INFINITY,
      };
    })
    .sort((left, right) => {
      if (left.liveCount !== right.liveCount) {
        return left.liveCount - right.liveCount;
      }

      if (left.assignedCount !== right.assignedCount) {
        return left.assignedCount - right.assignedCount;
      }

      return left.distanceMeters - right.distanceMeters;
    })
    .slice(0, DELIVERY_DISPATCH_BATCH_SIZE)
    .map((entry) => entry.riderId);
}

async function startNextDeliveryDispatchRound(order) {
  clearDispatchRoundTimer(order._id);

  if (order.status !== "Ready for pickup" || order.deliveryPartnerId) {
    return mapOrder(order.toObject());
  }

  const nextRiderIds = await getDeliveryDispatchCandidatesForOrder(order);

  if (!nextRiderIds.length) {
    order.deliveryDispatchExhaustedAt = order.deliveryDispatchExhaustedAt || new Date();
    order.deliveryDispatchWindowExpiresAt = null;
    await order.save();
    return mapOrder(order.toObject());
  }

  order.deliveryDispatchRound = (order.deliveryDispatchRound || 0) + 1;
  order.deliveryDispatchWindowExpiresAt = new Date(
    Date.now() + DELIVERY_DISPATCH_WINDOW_MS,
  );
  order.deliveryDispatchExhaustedAt = null;
  order.deliveryDispatchNotifiedPartnerIds = [
    ...(order.deliveryDispatchNotifiedPartnerIds ?? []),
    ...nextRiderIds.map((id) => new Types.ObjectId(id)),
  ];
  await order.save();

  const mappedOrder = mapOrder(order.toObject());
  await notifyDeliveryPartnersForOrder(mappedOrder, {
    targetUserIds: nextRiderIds,
  });
  const timer = setTimeout(async () => {
    try {
      const freshOrder = await Order.findById(order._id);

      if (!freshOrder) {
        clearDispatchRoundTimer(order._id);
        return;
      }

      if (
        freshOrder.status !== "Ready for pickup" ||
        freshOrder.deliveryPartnerId ||
        !freshOrder.deliveryDispatchWindowExpiresAt ||
        freshOrder.deliveryDispatchWindowExpiresAt.getTime() > Date.now()
      ) {
        return;
      }

      await startNextDeliveryDispatchRound(freshOrder);
    } catch (error) {
      console.error("[dispatch] auto-advance failed", error);
    }
  }, DELIVERY_DISPATCH_WINDOW_MS + 250);
  dispatchRoundTimers.set(String(order._id), timer);

  return mappedOrder;
}

async function advanceExpiredDeliveryDispatchRounds() {
  const expiredOrders = await Order.find({
    status: "Ready for pickup",
    deliveryPartnerId: null,
    deliveryDispatchWindowExpiresAt: {
      $ne: null,
      $lte: new Date(),
    },
  }).sort({ readyForPickupAt: 1 });

  for (const order of expiredOrders) {
    await startNextDeliveryDispatchRound(order);
  }
}

function assertOwnerCanAccessOrder(userId, order) {
  if (!order.restaurantOwnerId || String(order.restaurantOwnerId) !== userId) {
    throw new AppError("This order is not linked to your restaurant", 403);
  }
}

function assertDeliveryPartnerCanAccessOrder(userId, order) {
  if (!order.deliveryPartnerId || String(order.deliveryPartnerId) !== userId) {
    throw new AppError("This delivery task is not assigned to you", 403);
  }
}

async function createOrder(userId, payload) {
  const restaurant = await getRestaurantSnapshot(payload.restaurantId);
  const pendingPresentation = getStatusPresentation("Pending acceptance", restaurant);
  const lineItems = normalizeLineItemsWithPricing(payload.items, restaurant);
  const paymentMethod = payload.paymentMethod === "bkash" ? "bKash" : "COD";
  const deliveryAddress = payload.deliveryAddress?.trim();
  const deliveryLocation = normalizeDeliveryLocation(payload.deliveryLocation);

  if (!deliveryAddress) {
    throw new AppError("Delivery address is required", 400);
  }

  const pricing = buildPricingBreakdown({
    restaurant,
    lineItems,
    couponCode: payload.couponCode,
  });

  if (
    payload.totalTk !== undefined &&
    normalizeMoney(payload.totalTk, "Total") !== pricing.totalTk
  ) {
    throw new AppError("Cart total changed. Please review the latest summary.", 409);
  }

  const order = await Order.create({
    orderCode: await generateOrderCode(),
    userId,
    restaurantId: restaurant._id,
    restaurantOwnerId: restaurant.ownerId || null,
    restaurantName: restaurant.name,
    restaurantAccent: restaurant.accent,
    restaurantIcon: pendingPresentation.icon,
    restaurantCoverImage: restaurant.coverImage,
    status: "Pending acceptance",
    eta: pendingPresentation.eta,
    subtotalTk: pricing.subtotalTk,
    deliveryTk: pricing.deliveryTk,
    serviceFeeTk: pricing.serviceFeeTk,
    discountTk: pricing.discountTk,
    couponCode: pricing.couponCode || "",
    appliedOffer: pricing.appliedOffer,
    totalTk: pricing.totalTk,
    items: lineItems.map((item) => item.name),
    lineItems,
    paymentMethod,
    deliveryAddress,
    deliveryLocation,
    note: payload.note?.trim() || "",
    canTrack: false,
    riderName: "",
    statusHistory: [
      {
        status: "Pending acceptance",
        actorRole: "customer",
        note: "Order placed by customer",
        createdAt: new Date(),
      },
    ],
    placedAt: new Date(),
  });

  const mappedOrder = mapOrder(order.toObject());

  if (order.restaurantOwnerId) {
    emitOwnerOrderChanged(String(order.restaurantOwnerId), {
      type: "created",
      order: mappedOrder,
    });
    void notifyOwnerForOrder(String(order.restaurantOwnerId), mappedOrder, "created");
  }

  emitCustomerOrderChanged(String(userId), {
    type: "created",
    order: mappedOrder,
  });
  void notifyCustomerForOrder(mappedOrder, "created");

  return mappedOrder;
}

async function getOrderQuote(payload) {
  const restaurant = await getRestaurantSnapshot(payload.restaurantId);
  const lineItems = normalizeLineItemsWithPricing(payload.items, restaurant);

  return buildPricingBreakdown({
    restaurant,
    lineItems,
    couponCode: payload.couponCode,
  });
}

async function listRestaurantOwnerOrders(ownerUserId) {
  const orders = await Order.find({
    restaurantOwnerId: ownerUserId,
    status: { $in: ACTIVE_STATUSES },
  })
    .sort({ placedAt: -1 })
    .lean();

  return orders.map(mapOrder);
}

async function listAvailableDeliveryOrders(deliveryPartnerId) {
  await advanceExpiredDeliveryDispatchRounds();

  const orders = await Order.find({
    status: "Ready for pickup",
    deliveryPartnerId: null,
    $or: [
      {
        deliveryDispatchWindowExpiresAt: {
          $gt: new Date(),
        },
        deliveryDispatchNotifiedPartnerIds: deliveryPartnerId,
      },
      {
        deliveryDispatchExhaustedAt: {
          $ne: null,
        },
      },
    ],
  })
    .sort({ readyForPickupAt: -1, placedAt: -1 })
    .lean();

  return orders.map(mapOrder);
}

async function listAssignedDeliveryOrders(deliveryPartnerId) {
  const orders = await Order.find({
    deliveryPartnerId,
    status: { $in: ["Ready for pickup", "On the way"] },
  })
    .sort({ deliveryAcceptedAt: -1, placedAt: -1 })
    .lean();

  return orders.map(mapOrder);
}

async function listActiveOrders(userId) {
  const orders = await Order.find({
    userId,
    status: { $in: ACTIVE_STATUSES },
  })
    .sort({ placedAt: -1 })
    .lean();

  return orders.map(mapOrder);
}

async function listOrderHistory(userId) {
  const orders = await Order.find({
    userId,
    status: { $in: HISTORY_STATUSES },
  })
    .sort({ placedAt: -1 })
    .lean();

  return orders.map(mapOrder);
}

async function getOrderDetails(userId, orderId) {
  validateObjectId(orderId, "Order not found");

  const order = await Order.findOne({
    _id: orderId,
    userId,
  }).lean();

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return mapOrder(order);
}

async function cancelOrder(userId, orderId) {
  validateObjectId(orderId, "Order not found");

  const order = await Order.findOne({
    _id: orderId,
    userId,
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status !== "Pending acceptance") {
    throw new AppError("This order can no longer be cancelled", 400);
  }

  order.status = "Cancelled";
  order.eta = getStatusPresentation("Cancelled").eta;
  order.canTrack = getStatusPresentation("Cancelled").canTrack;
  order.riderName = getStatusPresentation("Cancelled").riderName;
  order.restaurantIcon = getStatusPresentation("Cancelled").icon;
  order.statusHistory.push({
    status: "Cancelled",
    actorRole: "customer",
    note: "Cancelled before restaurant acceptance",
    createdAt: new Date(),
  });
  await order.save();
  clearDispatchRoundTimer(order._id);
  const mappedOrder = mapOrder(order.toObject());

  if (order.restaurantOwnerId) {
    emitOwnerOrderChanged(String(order.restaurantOwnerId), {
      type: "cancelled",
      order: mappedOrder,
    });
    void notifyOwnerForOrder(String(order.restaurantOwnerId), mappedOrder, "cancelled");
  }

  emitCustomerOrderChanged(String(userId), {
    type: "cancelled",
    order: mappedOrder,
  });
  void notifyCustomerForOrder(mappedOrder, "cancelled");

  return mappedOrder;
}

async function assignDeliveryPartner(actorUser, orderId) {
  validateObjectId(orderId, "Order not found");

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (actorUser.role !== "delivery_partner") {
    throw new AppError("You can not accept this delivery task", 403);
  }

  if (order.status !== "Ready for pickup") {
    throw new AppError("This order is not ready for rider assignment yet", 400);
  }

  if (
    order.deliveryPartnerId &&
    String(order.deliveryPartnerId) !== String(actorUser._id)
  ) {
    throw new AppError("This order is already accepted by another rider", 409);
  }

  order.deliveryPartnerId = actorUser._id;
  order.deliveryAcceptedAt = order.deliveryAcceptedAt ?? new Date();
  order.riderName = actorUser.name?.trim() || "Delivery partner";
  order.deliveryTransportMode = actorUser.deliveryTransportMode || "bicycle";
  order.deliveryDispatchWindowExpiresAt = null;
  order.deliveryDispatchNotifiedPartnerIds = [];
  order.deliveryDispatchExhaustedAt = null;
  order.statusHistory.push({
    status: order.status,
    actorRole: "delivery_partner",
    note: "Delivery partner accepted this order",
    createdAt: new Date(),
  });

  await order.save();
  clearDispatchRoundTimer(order._id);
  const mappedOrder = mapOrder(order.toObject());

  if (order.restaurantOwnerId) {
    emitOwnerOrderChanged(String(order.restaurantOwnerId), {
      type: "delivery_assigned",
      order: mappedOrder,
    });
    void notifyOwnerForOrder(
      String(order.restaurantOwnerId),
      mappedOrder,
      "delivery_assigned",
    );
  }

  emitDeliveryOrdersChanged(String(actorUser._id), {
    type: "assigned",
    order: mappedOrder,
  });

  emitCustomerOrderChanged(String(order.userId), {
    type: "delivery_assigned",
    order: mappedOrder,
  });
  void notifyCustomerForOrder(mappedOrder, "delivery_assigned");

  return mappedOrder;
}

async function updateOrderStatus(actorUser, orderId, payload) {
  validateObjectId(orderId, "Order not found");

  const status = payload.status?.trim();
  if (!ORDER_STATUSES.includes(status)) {
    throw new AppError("Invalid order status", 400);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const actorRole = actorUser.role;

  if (actorRole === "restaurant_owner") {
    assertOwnerCanAccessOrder(String(actorUser._id), order);
  }

  if (actorRole === "delivery_partner") {
    assertDeliveryPartnerCanAccessOrder(String(actorUser._id), order);
  }

  const allowedStatuses = ALLOWED_TRANSITIONS[actorRole]?.[order.status] ?? [];
  if (!allowedStatuses.includes(status)) {
    throw new AppError("This status change is not allowed", 400);
  }

  const restaurant = await Restaurant.findById(order.restaurantId)
    .select("_id deliveryTime defaultPrepMinMinutes defaultPrepMaxMinutes")
    .lean();
  const prepWindow =
    status === "Preparing"
      ? normalizePreparationWindow(payload, restaurant)
      : {
          minMinutes: order.prepareMinMinutes,
          maxMinutes: order.prepareMaxMinutes,
        };
  const presentation = getStatusPresentation(status, restaurant, {
    prepareMinMinutes: prepWindow.minMinutes,
    prepareMaxMinutes: prepWindow.maxMinutes,
  });

  order.status = status;
  order.eta = presentation.eta;
  order.canTrack = presentation.canTrack;
  order.restaurantIcon = presentation.icon;

  if (status === "On the way" && payload.riderName?.trim()) {
    order.riderName = payload.riderName.trim();
  } else if (presentation.riderName !== undefined) {
    order.riderName = presentation.riderName;
  }

  if (actorRole === "delivery_partner") {
    order.deliveryTransportMode =
      actorUser.deliveryTransportMode || order.deliveryTransportMode || "bicycle";
  }

  if (status === "On the way") {
    const anotherLiveOrder = await Order.exists({
      deliveryPartnerId: actorUser._id,
      status: "On the way",
      _id: { $ne: order._id },
    });

    if (anotherLiveOrder) {
      throw new AppError(
        "Finish or deliver the current live order before starting another route",
        409,
      );
    }
  }

  if (status === "Preparing") {
    const acceptedAt = order.restaurantAcceptedAt ?? new Date();
    order.restaurantAcceptedAt = acceptedAt;
    order.prepareMinMinutes = prepWindow.minMinutes;
    order.prepareMaxMinutes = prepWindow.maxMinutes;
    order.estimatedReadyAt = addMinutes(acceptedAt, prepWindow.maxMinutes);
  }

  if (status === "Ready for pickup") {
    order.readyForPickupAt = new Date();
    order.estimatedReadyAt = null;
    order.deliveryDispatchRound = 0;
    order.deliveryDispatchWindowExpiresAt = null;
    order.deliveryDispatchNotifiedPartnerIds = [];
    order.deliveryDispatchExhaustedAt = null;
  }

  if (status === "On the way") {
    order.pickedUpAt = new Date();
  }

  if (status === "Delivered") {
    order.deliveredAt = new Date();
    order.deliveryLiveLocation = null;
  }

  if (status === "Cancelled") {
    order.deliveryLiveLocation = null;
  }

  order.statusHistory.push({
    status,
    actorRole,
    note: payload.note?.trim() || "",
    createdAt: new Date(),
  });

  await order.save();
  if (status !== "Ready for pickup") {
    clearDispatchRoundTimer(order._id);
  }
  const mappedOrder = mapOrder(order.toObject());

  if (order.restaurantOwnerId) {
    emitOwnerOrderChanged(String(order.restaurantOwnerId), {
      type: "status_updated",
      order: mappedOrder,
    });
    void notifyOwnerForOrder(String(order.restaurantOwnerId), mappedOrder, "status");
  }

  if (order.deliveryPartnerId) {
    emitDeliveryOrdersChanged(String(order.deliveryPartnerId), {
      type: "status_updated",
      order: mappedOrder,
    });
  }

  emitCustomerOrderChanged(String(order.userId), {
    type: "status_updated",
    order: mappedOrder,
  });
  void notifyCustomerForOrder(mappedOrder, "status");
  if (status === "Ready for pickup") {
    return startNextDeliveryDispatchRound(order);
  }

  return mappedOrder;
}

async function updatePreparationWindow(actorUser, orderId, payload) {
  validateObjectId(orderId, "Order not found");

  if (!["restaurant_owner", "admin"].includes(actorUser.role)) {
    throw new AppError("You can not update the preparation time for this order", 403);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (actorUser.role === "restaurant_owner") {
    assertOwnerCanAccessOrder(String(actorUser._id), order);
  }

  if (order.status !== "Preparing") {
    throw new AppError("Preparation time can only be updated while the order is preparing", 400);
  }

  const restaurant = await Restaurant.findById(order.restaurantId)
    .select("_id defaultPrepMinMinutes defaultPrepMaxMinutes")
    .lean();

  const prepWindow = normalizePreparationWindow(payload, restaurant);
  const acceptedAt = order.restaurantAcceptedAt ?? new Date();

  order.restaurantAcceptedAt = acceptedAt;
  order.prepareMinMinutes = prepWindow.minMinutes;
  order.prepareMaxMinutes = prepWindow.maxMinutes;
  order.estimatedReadyAt = addMinutes(acceptedAt, prepWindow.maxMinutes);
  order.eta = buildPreparingEta(prepWindow.minMinutes, prepWindow.maxMinutes);
  order.statusHistory.push({
    status: order.status,
    actorRole: actorUser.role,
    note:
      payload.note?.trim() ||
      `Preparation time updated to ${formatPrepRange(
        prepWindow.minMinutes,
        prepWindow.maxMinutes,
      )}`,
    createdAt: new Date(),
  });

  await order.save();
  const mappedOrder = mapOrder(order.toObject());

  if (order.restaurantOwnerId) {
    emitOwnerOrderChanged(String(order.restaurantOwnerId), {
      type: "prep_window_updated",
      order: mappedOrder,
    });
    void notifyOwnerForOrder(
      String(order.restaurantOwnerId),
      mappedOrder,
      "prep_window_updated",
    );
  }

  if (order.deliveryPartnerId) {
    emitDeliveryOrdersChanged(String(order.deliveryPartnerId), {
      type: "prep_window_updated",
      order: mappedOrder,
    });
  }

  emitCustomerOrderChanged(String(order.userId), {
    type: "prep_window_updated",
    order: mappedOrder,
  });
  void notifyCustomerForOrder(mappedOrder, "prep_window_updated");

  return mappedOrder;
}

async function updateDeliveryLiveLocation(actorUser, orderId, payload) {
  validateObjectId(orderId, "Order not found");

  if (actorUser.role !== "delivery_partner") {
    throw new AppError("You can not update live location for this order", 403);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  assertDeliveryPartnerCanAccessOrder(String(actorUser._id), order);

  if (order.status !== "On the way") {
    throw new AppError("Live location can only be shared while the order is on the way", 400);
  }

  const anotherLiveOrder = await Order.exists({
    deliveryPartnerId: actorUser._id,
    status: "On the way",
    _id: { $ne: order._id },
  });

  if (anotherLiveOrder) {
    throw new AppError(
      "Only one picked-up order can share live location at a time",
      409,
    );
  }

  order.deliveryLiveLocation = normalizeLiveLocation(payload);
  await order.save();
  await User.updateOne(
    { _id: actorUser._id },
    {
      $set: {
        liveDeliveryLocation: {
          latitude: order.deliveryLiveLocation.latitude,
          longitude: order.deliveryLiveLocation.longitude,
          heading: order.deliveryLiveLocation.heading ?? null,
          speed: order.deliveryLiveLocation.speed ?? null,
          updatedAt: order.deliveryLiveLocation.updatedAt,
        },
      },
    },
  );
  const mappedOrder = mapOrder(order.toObject());

  if (order.restaurantOwnerId) {
    emitOwnerOrderChanged(String(order.restaurantOwnerId), {
      type: "location_updated",
      order: mappedOrder,
    });
  }

  emitDeliveryOrdersChanged(String(actorUser._id), {
    type: "location_updated",
    order: mappedOrder,
  });

  emitCustomerOrderChanged(String(order.userId), {
    type: "location_updated",
    order: mappedOrder,
  });

  return mappedOrder;
}

module.exports = {
  ACTIVE_STATUSES,
  assignDeliveryPartner,
  cancelOrder,
  createOrder,
  getOrderDetails,
  getOrderQuote,
  listAssignedDeliveryOrders,
  listActiveOrders,
  listAvailableDeliveryOrders,
  listOrderHistory,
  listRestaurantOwnerOrders,
  updateDeliveryLiveLocation,
  updatePreparationWindow,
  updateOrderStatus,
};
