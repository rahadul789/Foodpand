const express = require("express");

const { requireAuth } = require("../../common/middlewares/auth");
const { requireRole } = require("../../common/middlewares/require-role");
const { sendResponse } = require("../../common/utils/api-response");
const {
  getMeController,
  registerPushTokenController,
  updateDeliveryPresenceController,
  unregisterPushTokenController,
} = require("./user.controller");

const userRoutes = express.Router();

userRoutes.get("/__meta", (_req, res) => {
  return sendResponse(res, {
    message: "Users module scaffold ready",
    data: {
      module: "users",
      next: ["profile", "saved addresses", "current location"],
    },
  });
});

userRoutes.get("/me", requireAuth, getMeController);
userRoutes.post("/push-token", requireAuth, registerPushTokenController);
userRoutes.delete("/push-token", requireAuth, unregisterPushTokenController);
userRoutes.patch(
  "/delivery-presence",
  requireAuth,
  requireRole("delivery_partner"),
  updateDeliveryPresenceController,
);

module.exports = { userRoutes };
