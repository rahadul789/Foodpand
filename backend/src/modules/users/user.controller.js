const { asyncHandler } = require("../../common/utils/async-handler");
const { sendResponse } = require("../../common/utils/api-response");
const {
  getCurrentUser,
  registerPushToken,
  updateDeliveryPresence,
  unregisterPushToken,
} = require("./user.service");

const getMeController = asyncHandler(async (req, res) => {
  const data = await getCurrentUser(req.auth.userId);

  return sendResponse(res, {
    message: "User profile fetched successfully",
    data,
  });
});

const registerPushTokenController = asyncHandler(async (req, res) => {
  const data = await registerPushToken(req.auth.userId, req.body ?? {});

  return sendResponse(res, {
    message: "Push token registered successfully",
    data,
  });
});

const unregisterPushTokenController = asyncHandler(async (req, res) => {
  const data = await unregisterPushToken(req.auth.userId, req.body ?? {});

  return sendResponse(res, {
    message: "Push token removed successfully",
    data,
  });
});

const updateDeliveryPresenceController = asyncHandler(async (req, res) => {
  const data = await updateDeliveryPresence(req.auth.userId, req.body ?? {});

  return sendResponse(res, {
    message: "Delivery presence updated successfully",
    data,
  });
});

module.exports = {
  getMeController,
  registerPushTokenController,
  updateDeliveryPresenceController,
  unregisterPushTokenController,
};
