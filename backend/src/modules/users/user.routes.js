const express = require("express");

const { requireAuth } = require("../../common/middlewares/auth");
const { sendResponse } = require("../../common/utils/api-response");
const { getMeController } = require("./user.controller");

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

module.exports = { userRoutes };
