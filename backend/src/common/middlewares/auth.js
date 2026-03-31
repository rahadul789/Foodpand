const jwt = require("jsonwebtoken");

const { env } = require("../../config/env");
const { AppError } = require("../utils/app-error");
const { User } = require("../../modules/users/user.model");

async function requireAuth(req, _res, next) {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return next(new AppError("Authentication required", 401));
    }

    if (!env.jwtSecret) {
      return next(new AppError("JWT secret is not configured", 500));
    }

    const token = authorization.slice(7).trim();
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findOne({
      _id: payload.sub,
      isActive: true,
    }).lean();

    if (!user) {
      return next(new AppError("User not found", 401));
    }

    req.auth = {
      userId: String(user._id),
    };
    req.user = user;

    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
}

module.exports = {
  requireAuth,
};
