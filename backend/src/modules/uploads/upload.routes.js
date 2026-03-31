const express = require("express");

const { requireAuth } = require("../../common/middlewares/auth");
const { requireRole } = require("../../common/middlewares/require-role");
const { createUploadSignatureController } = require("./upload.controller");

const uploadRoutes = express.Router();

uploadRoutes.post(
  "/signature",
  requireAuth,
  requireRole("restaurant_owner"),
  createUploadSignatureController,
);

module.exports = {
  uploadRoutes,
};
