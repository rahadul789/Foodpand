const { asyncHandler } = require("../../common/utils/async-handler");
const { sendResponse } = require("../../common/utils/api-response");
const { getCurrentUser } = require("./user.service");

const getMeController = asyncHandler(async (req, res) => {
  const data = await getCurrentUser(req.auth.userId);

  return sendResponse(res, {
    message: "User profile fetched successfully",
    data,
  });
});

module.exports = {
  getMeController,
};
