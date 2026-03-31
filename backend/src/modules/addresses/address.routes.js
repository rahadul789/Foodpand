const express = require("express");

const { requireAuth } = require("../../common/middlewares/auth");
const {
  createAddressController,
  listAddressesController,
  removeAddressController,
  selectDeliveryLocationController,
  updateAddressController,
  updateDeviceLocationController,
} = require("./address.controller");

const addressRoutes = express.Router();

addressRoutes.use(requireAuth);

addressRoutes.get("/", listAddressesController);
addressRoutes.post("/", createAddressController);
addressRoutes.patch("/selected", selectDeliveryLocationController);
addressRoutes.patch("/device-location", updateDeviceLocationController);
addressRoutes.patch("/:id", updateAddressController);
addressRoutes.delete("/:id", removeAddressController);

module.exports = {
  addressRoutes,
};
