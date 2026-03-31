const { asyncHandler } = require("../../common/utils/async-handler");
const { sendResponse } = require("../../common/utils/api-response");
const {
  createAddress,
  listAddresses,
  removeAddress,
  updateAddress,
  updateCurrentDeviceLocation,
  updateSelectedDeliveryLocation,
} = require("./address.service");

const listAddressesController = asyncHandler(async (req, res) => {
  const data = await listAddresses(req.auth.userId);

  return sendResponse(res, {
    message: "Addresses fetched successfully",
    data,
  });
});

const createAddressController = asyncHandler(async (req, res) => {
  const data = await createAddress(req.auth.userId, req.body || {});

  return sendResponse(res, {
    statusCode: 201,
    message: "Address saved successfully",
    data,
  });
});

const updateAddressController = asyncHandler(async (req, res) => {
  const data = await updateAddress(
    req.auth.userId,
    req.params.id,
    req.body || {},
  );

  return sendResponse(res, {
    message: "Address updated successfully",
    data,
  });
});

const removeAddressController = asyncHandler(async (req, res) => {
  await removeAddress(req.auth.userId, req.params.id);

  return sendResponse(res, {
    message: "Address removed successfully",
    data: {
      id: req.params.id,
    },
  });
});

const selectDeliveryLocationController = asyncHandler(async (req, res) => {
  const data = await updateSelectedDeliveryLocation(
    req.auth.userId,
    req.body || {},
  );

  return sendResponse(res, {
    message: "Selected delivery location updated",
    data,
  });
});

const updateDeviceLocationController = asyncHandler(async (req, res) => {
  const data = await updateCurrentDeviceLocation(
    req.auth.userId,
    req.body || {},
  );

  return sendResponse(res, {
    message: "Current device location updated",
    data,
  });
});

module.exports = {
  createAddressController,
  listAddressesController,
  removeAddressController,
  selectDeliveryLocationController,
  updateAddressController,
  updateDeviceLocationController,
};
