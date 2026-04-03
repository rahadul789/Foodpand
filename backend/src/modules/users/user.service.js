const { AppError } = require("../../common/utils/app-error");
const { User } = require("./user.model");
const { sanitizeUser } = require("../auth/auth.service");

async function getCurrentUser(userId) {
  const user = await User.findOne({
    _id: userId,
    isActive: true,
  }).lean();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return sanitizeUser(user);
}

async function registerPushToken(userId, payload) {
  const token = payload.token?.trim();
  const platform = payload.platform === "ios" ? "ios" : "android";
  const appId = payload.appId?.trim() || "customer-app";

  if (!token) {
    throw new AppError("Push token is required", 400);
  }

  const user = await User.findOne({
    _id: userId,
    isActive: true,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const nextTokens = (user.pushTokens ?? []).filter(
    (entry) => !(entry.appId === appId && entry.token === token),
  );

  nextTokens.unshift({
    token,
    platform,
    appId,
    updatedAt: new Date(),
  });

  user.pushTokens = nextTokens.slice(0, 8);
  await user.save();

  return { registered: true };
}

async function unregisterPushToken(userId, payload) {
  const token = payload.token?.trim();
  const appId = payload.appId?.trim() || "customer-app";

  if (!token) {
    throw new AppError("Push token is required", 400);
  }

  const user = await User.findOne({
    _id: userId,
    isActive: true,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.pushTokens = (user.pushTokens ?? []).filter(
    (entry) => !(entry.appId === appId && entry.token === token),
  );
  await user.save();

  return { removed: true };
}

function normalizePointLocation(payload) {
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new AppError("Latitude is invalid", 400);
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new AppError("Longitude is invalid", 400);
  }

  return {
    label: payload.label?.trim() || "",
    subtitle: payload.subtitle?.trim() || "",
    location: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    updatedAt: new Date(),
  };
}

async function updateDeliveryPresence(userId, payload) {
  const user = await User.findOne({
    _id: userId,
    isActive: true,
    role: "delivery_partner",
  });

  if (!user) {
    throw new AppError("Delivery partner not found", 404);
  }

  const isOnline =
    payload.isOnline === undefined ? true : Boolean(payload.isOnline);
  const acceptsNewOrders =
    payload.acceptsNewOrders === undefined
      ? true
      : Boolean(payload.acceptsNewOrders);

  user.deliveryAvailability = {
    isOnline,
    acceptsNewOrders,
    lastSeenAt: new Date(),
  };

  if (
    payload.latitude !== undefined &&
    payload.longitude !== undefined
  ) {
    user.currentDeviceLocation = normalizePointLocation(payload);
  }

  if (payload.deliveryTransportMode) {
    user.deliveryTransportMode = payload.deliveryTransportMode;
  }

  await user.save();

  return sanitizeUser(user);
}

module.exports = {
  getCurrentUser,
  registerPushToken,
  updateDeliveryPresence,
  unregisterPushToken,
};
