const express = require("express");

const { requireAuth } = require("../../common/middlewares/auth");
const { requireRole } = require("../../common/middlewares/require-role");
const {
  assignDeliveryPartnerController,
  cancelOrderController,
  createOrderController,
  getOrderDetailsController,
  getOrderQuoteController,
  listActiveOrdersController,
  listAssignedDeliveryOrdersController,
  listAvailableDeliveryOrdersController,
  listOrderHistoryController,
  listRestaurantOwnerOrdersController,
  updateDeliveryLiveLocationController,
  updatePreparationWindowController,
  updateOrderStatusController,
} = require("./order.controller");

const orderRoutes = express.Router();

orderRoutes.post("/quote", getOrderQuoteController);

orderRoutes.use(requireAuth);

orderRoutes.get(
  "/restaurant/inbox",
  requireRole("restaurant_owner"),
  listRestaurantOwnerOrdersController,
);
orderRoutes.get(
  "/delivery/available",
  requireRole("delivery_partner"),
  listAvailableDeliveryOrdersController,
);
orderRoutes.get(
  "/delivery/assigned",
  requireRole("delivery_partner"),
  listAssignedDeliveryOrdersController,
);
orderRoutes.get("/active", listActiveOrdersController);
orderRoutes.get("/history", listOrderHistoryController);
orderRoutes.get("/:orderId", getOrderDetailsController);
orderRoutes.post("/", createOrderController);
orderRoutes.patch("/:orderId/cancel", cancelOrderController);
orderRoutes.patch(
  "/:orderId/assign-delivery",
  requireRole("delivery_partner"),
  assignDeliveryPartnerController,
);
orderRoutes.patch(
  "/:orderId/location",
  requireRole("delivery_partner"),
  updateDeliveryLiveLocationController,
);
orderRoutes.patch(
  "/:orderId/preparation-window",
  requireRole("restaurant_owner", "admin"),
  updatePreparationWindowController,
);
orderRoutes.patch("/:orderId/status", updateOrderStatusController);

module.exports = { orderRoutes };
