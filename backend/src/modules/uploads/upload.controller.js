const { asyncHandler } = require("../../common/utils/async-handler");
const { sendResponse } = require("../../common/utils/api-response");
const { createUploadSignature } = require("./upload.service");

const createUploadSignatureController = asyncHandler(async (req, res) => {
  const data = createUploadSignature(req.user, req.body);

  return sendResponse(res, {
    message: "Upload signature created successfully",
    data,
  });
});

module.exports = {
  createUploadSignatureController,
};
