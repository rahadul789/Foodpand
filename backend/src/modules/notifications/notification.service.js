const { User } = require("../users/user.model");
const { Notification } = require("./notification.model");
const { AppError } = require("../../common/utils/app-error");
const { Order } = require("../orders/order.model");
const { Restaurant } = require("../restaurants/restaurant.model");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CUSTOMER_APP_ID = "customer-app";
const DELIVERY_APP_ID = "delivery-app";
const DELIVERY_NOTIFY_BATCH = 5;

function isExpoPushToken(token) {
  return typeof token === "string" && token.startsWith("ExponentPushToken[");
}

function mapNotification(notification) {
  return {
    id: String(notification._id),
    category: notification.category,
    title: notification.title,
    body: notification.body,
    unread: Boolean(notification.unread),
    target: notification.target || "notifications",
    targetOrderId: notification.targetOrderId
      ? String(notification.targetOrderId)
      : undefined,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString(),
  };
}

function buildPushMessages(tokens, payload) {
  return tokens.map((token) => ({
    to: token,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
    channelId: "default",
  }));
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

function getUserDispatchLocation(user) {
  const [deviceLongitude, deviceLatitude] =
    user.currentDeviceLocation?.location?.coordinates ?? [];

  if (
    Number.isFinite(deviceLatitude) &&
    Number.isFinite(deviceLongitude) &&
    (deviceLatitude !== 0 || deviceLongitude !== 0)
  ) {
    return {
      latitude: deviceLatitude,
      longitude: deviceLongitude,
    };
  }

  if (
    Number.isFinite(user.liveDeliveryLocation?.latitude) &&
    Number.isFinite(user.liveDeliveryLocation?.longitude)
  ) {
    return {
      latitude: user.liveDeliveryLocation.latitude,
      longitude: user.liveDeliveryLocation.longitude,
    };
  }

  return null;
}

async function getDeliveryDispatchCandidates(mappedOrder) {
  const restaurant = await Restaurant.findById(mappedOrder.restaurantId)
    .select("location")
    .lean();

  const [restaurantLongitude, restaurantLatitude] =
    restaurant?.location?.coordinates ?? [];

  const restaurantLocation =
    Number.isFinite(restaurantLatitude) &&
    Number.isFinite(restaurantLongitude)
      ? {
          latitude: restaurantLatitude,
          longitude: restaurantLongitude,
        }
      : null;

  const riders = await User.find({
    role: "delivery_partner",
    isActive: true,
    "deliveryAvailability.isOnline": true,
    "deliveryAvailability.acceptsNewOrders": { $ne: false },
    "pushTokens.appId": DELIVERY_APP_ID,
  })
    .select(
      "_id name currentDeviceLocation liveDeliveryLocation deliveryAvailability pushTokens",
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
      const riderLocation = getUserDispatchLocation(rider);

      return {
        rider,
        assignedCount: counts.assignedCount,
        liveCount: counts.liveCount,
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
    .slice(0, DELIVERY_NOTIFY_BATCH);
}

async function sendExpoPushMessages(messages) {
  if (!messages.length) {
    return { sent: 0 };
  }

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Expo push request failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function sendPushToUser(userId, payload) {
  const user = await User.findById(userId).select("pushTokens").lean();

  if (!user) {
    return { sent: 0 };
  }

  const tokens = (user.pushTokens ?? [])
    .filter((entry) => entry.appId === (payload.appId || CUSTOMER_APP_ID))
    .map((entry) => entry.token)
    .filter(isExpoPushToken);

  if (!tokens.length) {
    return { sent: 0 };
  }

  return sendExpoPushMessages(buildPushMessages(tokens, payload));
}

async function safeSendPushToUser(userId, payload) {
  try {
    return await sendPushToUser(userId, payload);
  } catch (error) {
    console.error("[push] send failed", error);
    return { sent: 0, failed: true };
  }
}

async function createNotification(userId, payload) {
  const notification = await Notification.create({
    userId,
    category: payload.category || "orders",
    title: payload.title,
    body: payload.body,
    target: payload.target || "notifications",
    targetOrderId: payload.targetOrderId || null,
    metadata: payload.metadata || null,
  });

  return mapNotification(notification.toObject());
}

async function listNotifications(userId) {
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const unreadCount = notifications.filter((entry) => entry.unread).length;

  return {
    notifications: notifications.map(mapNotification),
    unreadCount,
  };
}

async function markNotificationAsRead(userId, notificationId) {
  const notification = await Notification.findOne({
    _id: notificationId,
    userId,
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.unread) {
    notification.unread = false;
    notification.readAt = new Date();
    await notification.save();
  }

  return mapNotification(notification.toObject());
}

async function markAllNotificationsAsRead(userId) {
  await Notification.updateMany(
    {
      userId,
      unread: true,
    },
    {
      $set: {
        unread: false,
        readAt: new Date(),
      },
    },
  );

  return listNotifications(userId);
}

function getOrderPushCopy(mappedOrder, eventType = "status") {
  const orderCode = mappedOrder.orderCode || mappedOrder.id;
  const restaurantName = mappedOrder.restaurantName;

  switch (eventType) {
    case "created":
      return {
        title: "Order placed successfully",
        body: `${restaurantName} received your order ${orderCode}. They will review it shortly.`,
      };
    case "cancelled":
      return {
        title: "Order cancelled",
        body: `Your order ${orderCode} was cancelled successfully.`,
      };
    case "delivery_assigned":
      return {
        title: "Rider accepted your order",
        body: `${mappedOrder.riderName || "A rider"} accepted ${orderCode} and will pick it up soon.`,
      };
    case "prep_window_updated":
      return {
        title: "Preparation time updated",
        body: `${restaurantName} updated the preparation time for ${orderCode}.`,
      };
    case "status":
    default: {
      switch (mappedOrder.status) {
        case "Preparing":
          return {
            title: "Restaurant started preparing",
            body: `${restaurantName} is now preparing your order ${orderCode}.`,
          };
        case "Ready for pickup":
          return {
            title: "Order is ready for pickup",
            body: `${restaurantName} finished your order ${orderCode}. A rider will pick it up soon.`,
          };
        case "On the way":
          return {
            title: "Order is on the way",
            body: `${mappedOrder.riderName || "Your rider"} is now heading to you with ${orderCode}.`,
          };
        case "Delivered":
          return {
            title: "Order delivered",
            body: `Your order ${orderCode} has been delivered successfully.`,
          };
        case "Cancelled":
          return {
            title: "Order cancelled",
            body: `Your order ${orderCode} has been cancelled.`,
          };
        default:
          return {
            title: "Order updated",
            body: `Your order ${orderCode} has a new update.`,
          };
      }
    }
  }
}

function getOwnerOrderCopy(mappedOrder, eventType = "status") {
  const orderCode = mappedOrder.orderCode || mappedOrder.id;
  const customerLabel = mappedOrder.deliveryAddress || "customer address";

  switch (eventType) {
    case "created":
      return {
        title: "New order received",
        body: `Order ${orderCode} is waiting for restaurant acceptance.`,
      };
    case "cancelled":
      return {
        title: "Customer cancelled the order",
        body: `Order ${orderCode} was cancelled before kitchen acceptance.`,
      };
    case "delivery_assigned":
      return {
        title: "Rider accepted the pickup",
        body: `${mappedOrder.riderName || "A rider"} accepted order ${orderCode}.`,
      };
    case "prep_window_updated":
      return {
        title: "Preparation time updated",
        body: `Order ${orderCode} now shows a new kitchen estimate.`,
      };
    case "status":
    default:
      switch (mappedOrder.status) {
        case "Preparing":
          return {
            title: "Kitchen started preparing",
            body: `Order ${orderCode} is now preparing for ${customerLabel}.`,
          };
        case "Ready for pickup":
          return {
            title: "Order ready for pickup",
            body: `Order ${orderCode} is ready for rider handoff.`,
          };
        case "On the way":
          return {
            title: "Order picked up",
            body: `Order ${orderCode} is now on the way to the customer.`,
          };
        case "Delivered":
          return {
            title: "Order delivered",
            body: `Order ${orderCode} was delivered successfully.`,
          };
        case "Cancelled":
          return {
            title: "Order cancelled",
            body: `Order ${orderCode} has been cancelled.`,
          };
        default:
          return {
            title: "Order updated",
            body: `Order ${orderCode} has a new update.`,
          };
      }
  }
}

async function notifyCustomerForOrder(mappedOrder, eventType = "status") {
  try {
    const copy = getOrderPushCopy(mappedOrder, eventType);
    const createdNotification = await createNotification(mappedOrder.userId, {
      category: "orders",
      title: copy.title,
      body: copy.body,
      target: mappedOrder.id ? "order" : "notifications",
      targetOrderId: mappedOrder.id || null,
      metadata: {
        orderCode: mappedOrder.orderCode,
        status: mappedOrder.status,
      },
    });

    return safeSendPushToUser(
      mappedOrder.userId || mappedOrder.customerId || mappedOrder.user?.id,
      {
        appId: CUSTOMER_APP_ID,
        title: copy.title,
        body: copy.body,
        data: {
          notificationId: createdNotification.id,
          category: "orders",
          target: "notifications",
          orderId: mappedOrder.id,
          orderCode: mappedOrder.orderCode,
          status: mappedOrder.status,
        },
      },
    );
  } catch (error) {
    console.error("[notification] order notification failed", error);
    return { sent: 0, failed: true };
  }
}

async function notifyOwnerForOrder(ownerUserId, mappedOrder, eventType = "status") {
  try {
    if (!ownerUserId) {
      return { sent: 0 };
    }

    const copy = getOwnerOrderCopy(mappedOrder, eventType);
    await createNotification(ownerUserId, {
      category: "orders",
      title: copy.title,
      body: copy.body,
      target: "orders",
      targetOrderId: mappedOrder.id || null,
      metadata: {
        orderCode: mappedOrder.orderCode,
        status: mappedOrder.status,
        restaurantId: mappedOrder.restaurantId,
      },
    });

    return { sent: 1 };
  } catch (error) {
    console.error("[notification] owner notification failed", error);
    return { sent: 0, failed: true };
  }
}

async function notifyDeliveryPartnersForOrder(mappedOrder, options = {}) {
  try {
    if (mappedOrder.status !== "Ready for pickup") {
      return { sent: 0, targeted: 0 };
    }

    const candidates = options.targetUserIds?.length
      ? await User.find({
          _id: { $in: options.targetUserIds },
          role: "delivery_partner",
          isActive: true,
        })
          .select("_id")
          .lean()
          .then((rows) => rows.map((rider) => ({ rider })))
      : await getDeliveryDispatchCandidates(mappedOrder);

    if (!candidates.length) {
      return { sent: 0, targeted: 0 };
    }

    await Promise.all(
      candidates.map(async ({ rider }) => {
        const title = "New pickup nearby";
        const body = `${mappedOrder.restaurantName} has ${mappedOrder.orderCode || mappedOrder.id} ready for pickup.`;

        await createNotification(String(rider._id), {
          category: "orders",
          title,
          body,
          target: "available-orders",
          targetOrderId: mappedOrder.id || null,
          metadata: {
            orderCode: mappedOrder.orderCode,
            restaurantId: mappedOrder.restaurantId,
            status: mappedOrder.status,
          },
        });

        await safeSendPushToUser(String(rider._id), {
          appId: DELIVERY_APP_ID,
          title,
          body,
          data: {
            category: "orders",
            target: "available-orders",
            orderId: mappedOrder.id,
            orderCode: mappedOrder.orderCode,
            status: mappedOrder.status,
          },
        });
      }),
    );

    return {
      sent: candidates.length,
      targeted: candidates.length,
    };
  } catch (error) {
    console.error("[notification] delivery dispatch failed", error);
    return { sent: 0, failed: true };
  }
}

async function sendTestPush(userId) {
  const createdNotification = await createNotification(userId, {
    category: "orders",
    title: "Push is working",
    body: "Foodbela customer push notification setup looks good.",
    target: "notifications",
  });

  return safeSendPushToUser(userId, {
    appId: CUSTOMER_APP_ID,
    title: "Push is working",
    body: "Foodbela customer push notification setup looks good.",
    data: {
      notificationId: createdNotification.id,
      category: "orders",
      target: "notifications",
    },
  });
}

module.exports = {
  createNotification,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notifyCustomerForOrder,
  notifyDeliveryPartnersForOrder,
  notifyOwnerForOrder,
  sendTestPush,
};
