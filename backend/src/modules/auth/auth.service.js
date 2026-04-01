const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { env } = require("../../config/env");
const { AppError } = require("../../common/utils/app-error");
const { User } = require("../users/user.model");

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function sanitizeUser(user) {
  const selectedLocation = user.selectedDeliveryLocation;
  const locationParts = [
    selectedLocation?.label,
    selectedLocation?.subtitle,
  ].filter(Boolean);

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    deliveryTransportMode: user.deliveryTransportMode || undefined,
    location:
      locationParts.join(", ") || "Set your delivery location",
    loyaltyPoints: user.loyaltyPoints,
  };
}

function createAccessToken(userId) {
  if (!env.jwtSecret) {
    throw new AppError("JWT secret is not configured", 500);
  }

  return jwt.sign({}, env.jwtSecret, {
    subject: userId,
    expiresIn: env.jwtExpiresIn,
  });
}

async function signup(payload) {
  const name = payload.name?.trim();
  const email = normalizeEmail(payload.email || "");
  const phone = payload.phone?.trim();
  const password = payload.password?.trim();

  if (!name || name.length < 2) {
    throw new AppError("Name must be at least 2 characters", 400);
  }

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  if (!phone || phone.length < 11) {
    throw new AppError("Phone must be at least 11 digits", 400);
  }

  if (!password || password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  const existingUser = await User.findOne({
    email,
  }).lean();

  if (existingUser) {
    throw new AppError("An account already exists with this email", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    loyaltyPoints: 180,
  });

  return {
    user: sanitizeUser(user),
    accessToken: createAccessToken(String(user._id)),
  };
}

async function login(payload) {
  const email = normalizeEmail(payload.email || "");
  const password = payload.password?.trim();

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({
    email,
    isActive: true,
  });

  if (!user) {
    throw new AppError("Email or password is incorrect", 401);
  }

  const matched = await bcrypt.compare(password, user.passwordHash);

  if (!matched) {
    throw new AppError("Email or password is incorrect", 401);
  }

  return {
    user: sanitizeUser(user),
    accessToken: createAccessToken(String(user._id)),
  };
}

module.exports = {
  login,
  sanitizeUser,
  signup,
};
