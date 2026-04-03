const express = require("express");

const { requireAuth } = require("../../common/middlewares/auth");
const {
  listNotificationsController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
  sendTestPushController,
} = require("./notification.controller");

const notificationRoutes = express.Router();

notificationRoutes.use(requireAuth);
notificationRoutes.get("/", listNotificationsController);
notificationRoutes.patch("/read-all", markAllNotificationsAsReadController);
notificationRoutes.patch("/:notificationId/read", markNotificationAsReadController);
notificationRoutes.post("/test-push", sendTestPushController);

module.exports = {
  notificationRoutes,
};
