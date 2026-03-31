const express = require("express");
const { requireAuth } = require("../../common/middlewares/auth");
const { requireRole } = require("../../common/middlewares/require-role");

const {
  createOfferController,
  createMenuCategoryController,
  createMenuItemController,
  createRestaurantController,
  deleteOfferController,
  deleteMenuItemController,
  getRestaurantList,
  getRestaurantById,
  getRestaurantMenuById,
  getMyRestaurant,
  getMyRestaurantOffersController,
  getMyRestaurantMenuController,
  toggleOfferStatusController,
  toggleMenuItemStatusController,
  updateMyRestaurantController,
  updateOfferController,
  updateMenuItemController,
} = require("./restaurant.controller");

const restaurantRoutes = express.Router();

restaurantRoutes.get("/", getRestaurantList);
restaurantRoutes.get("/mine", requireAuth, requireRole("restaurant_owner"), getMyRestaurant);
restaurantRoutes.post("/", requireAuth, requireRole("restaurant_owner"), createRestaurantController);
restaurantRoutes.patch(
  "/mine",
  requireAuth,
  requireRole("restaurant_owner"),
  updateMyRestaurantController,
);
restaurantRoutes.get(
  "/mine/menu",
  requireAuth,
  requireRole("restaurant_owner"),
  getMyRestaurantMenuController,
);
restaurantRoutes.post(
  "/mine/menu/categories",
  requireAuth,
  requireRole("restaurant_owner"),
  createMenuCategoryController,
);
restaurantRoutes.post(
  "/mine/menu/items",
  requireAuth,
  requireRole("restaurant_owner"),
  createMenuItemController,
);
restaurantRoutes.patch(
  "/mine/menu/items/:itemKey",
  requireAuth,
  requireRole("restaurant_owner"),
  updateMenuItemController,
);
restaurantRoutes.patch(
  "/mine/menu/items/:itemKey/status",
  requireAuth,
  requireRole("restaurant_owner"),
  toggleMenuItemStatusController,
);
restaurantRoutes.delete(
  "/mine/menu/items/:itemKey",
  requireAuth,
  requireRole("restaurant_owner"),
  deleteMenuItemController,
);
restaurantRoutes.get(
  "/mine/offers",
  requireAuth,
  requireRole("restaurant_owner"),
  getMyRestaurantOffersController,
);
restaurantRoutes.post(
  "/mine/offers",
  requireAuth,
  requireRole("restaurant_owner"),
  createOfferController,
);
restaurantRoutes.patch(
  "/mine/offers/:offerId",
  requireAuth,
  requireRole("restaurant_owner"),
  updateOfferController,
);
restaurantRoutes.patch(
  "/mine/offers/:offerId/status",
  requireAuth,
  requireRole("restaurant_owner"),
  toggleOfferStatusController,
);
restaurantRoutes.delete(
  "/mine/offers/:offerId",
  requireAuth,
  requireRole("restaurant_owner"),
  deleteOfferController,
);
restaurantRoutes.get("/:id/menu", getRestaurantMenuById);
restaurantRoutes.get("/:id", getRestaurantById);

module.exports = { restaurantRoutes };
