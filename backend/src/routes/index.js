const express = require("express");

const { sendResponse } = require("../common/utils/api-response");
const { contentRoutes } = require("../modules/content/content.routes");
const { authRoutes } = require("../modules/auth/auth.routes");
const { userRoutes } = require("../modules/users/user.routes");
const { addressRoutes } = require("../modules/addresses/address.routes");
const { restaurantRoutes } = require("../modules/restaurants/restaurant.routes");
const { favoriteRoutes } = require("../modules/favorites/favorite.routes");
const { orderRoutes } = require("../modules/orders/order.routes");
const { uploadRoutes } = require("../modules/uploads/upload.routes");

const router = express.Router();

router.get("/health", (_req, res) => {
  return sendResponse(res, {
    message: "Backend is running",
    data: {
      status: "ok",
      version: "scaffold-v1",
    },
  });
});

router.use("/v1/auth", authRoutes);
router.use("/v1/users", userRoutes);
router.use("/v1/addresses", addressRoutes);
router.use("/v1/content", contentRoutes);
router.use("/v1/restaurants", restaurantRoutes);
router.use("/v1/favorites", favoriteRoutes);
router.use("/v1/orders", orderRoutes);
router.use("/v1/uploads", uploadRoutes);

module.exports = { router };
