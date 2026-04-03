const { asyncHandler } = require("../../common/utils/async-handler");
const { sendResponse } = require("../../common/utils/api-response");
const {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  sendTestPush,
} = require("./notification.service");

const listNotificationsController = asyncHandler(async (req, res) => {
  const data = await listNotifications(req.auth.userId);

  return sendResponse(res, {
    message: "Notifications fetched successfully",
    data,
  });
});

const markNotificationAsReadController = asyncHandler(async (req, res) => {
  const data = await markNotificationAsRead(req.auth.userId, req.params.notificationId);

  return sendResponse(res, {
    message: "Notification marked as read",
    data,
  });
});

const markAllNotificationsAsReadController = asyncHandler(async (req, res) => {
  const data = await markAllNotificationsAsRead(req.auth.userId);

  return sendResponse(res, {
    message: "All notifications marked as read",
    data,
  });
});

const sendTestPushController = asyncHandler(async (req, res) => {
  const data = await sendTestPush(req.auth.userId);

  return sendResponse(res, {
    message: "Test push request sent",
    data,
  });
});

module.exports = {
  listNotificationsController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
  sendTestPushController,
};
