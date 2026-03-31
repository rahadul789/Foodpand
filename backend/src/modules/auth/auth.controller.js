const { asyncHandler } = require("../../common/utils/async-handler");
const { sendResponse } = require("../../common/utils/api-response");
const { login, signup } = require("./auth.service");

const signupController = asyncHandler(async (req, res) => {
  const data = await signup(req.body || {});

  return sendResponse(res, {
    statusCode: 201,
    message: "Account created successfully",
    data,
  });
});

const loginController = asyncHandler(async (req, res) => {
  const data = await login(req.body || {});

  return sendResponse(res, {
    message: "Login successful",
    data,
  });
});

module.exports = {
  loginController,
  signupController,
};
