const express = require("express");

const { sendResponse } = require("../../common/utils/api-response");
const { loginController, signupController } = require("./auth.controller");

const authRoutes = express.Router();

authRoutes.get("/__meta", (_req, res) => {
  return sendResponse(res, {
    message: "Auth module scaffold ready",
    data: {
      module: "auth",
      next: ["signup", "login", "me"],
    },
  });
});

authRoutes.post("/signup", signupController);
authRoutes.post("/login", loginController);

module.exports = { authRoutes };
