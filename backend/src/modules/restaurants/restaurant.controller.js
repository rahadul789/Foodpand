const { asyncHandler } = require("../../common/utils/async-handler");
const { sendResponse } = require("../../common/utils/api-response");
const {
  createOffer,
  createMenuCategory,
  createMenuItem,
  createRestaurant,
  deleteOffer,
  deleteMenuItem,
  getOwnedRestaurantOffers,
  getOwnedRestaurantMenu,
  listRestaurants,
  toggleOfferStatus,
  toggleMenuItemStatus,
  getRestaurantDetails,
  getRestaurantMenu,
  getOwnedRestaurant,
  updateOwnedRestaurant,
  updateOffer,
  updateMenuItem,
} = require("./restaurant.service");

const getRestaurantList = asyncHandler(async (req, res) => {
  const { items, meta } = await listRestaurants(req.query);

  return sendResponse(res, {
    message: "Restaurants fetched successfully",
    data: items,
    meta,
  });
});

const getRestaurantById = asyncHandler(async (req, res) => {
  const data = await getRestaurantDetails(req.params.id);

  return sendResponse(res, {
    message: "Restaurant details fetched successfully",
    data,
  });
});

const getRestaurantMenuById = asyncHandler(async (req, res) => {
  const data = await getRestaurantMenu(req.params.id);

  return sendResponse(res, {
    message: "Restaurant menu fetched successfully",
    data,
  });
});

const getMyRestaurant = asyncHandler(async (req, res) => {
  const data = await getOwnedRestaurant(req.auth.userId);

  return sendResponse(res, {
    message: "Owner restaurant fetched successfully",
    data,
  });
});

const createRestaurantController = asyncHandler(async (req, res) => {
  const data = await createRestaurant(req.auth.userId, req.body);

  return sendResponse(res, {
    statusCode: 201,
    message: "Restaurant created successfully",
    data,
  });
});

const updateMyRestaurantController = asyncHandler(async (req, res) => {
  const data = await updateOwnedRestaurant(req.auth.userId, req.body);

  return sendResponse(res, {
    message: "Restaurant updated successfully",
    data,
  });
});

const getMyRestaurantMenuController = asyncHandler(async (req, res) => {
  const data = await getOwnedRestaurantMenu(req.auth.userId);

  return sendResponse(res, {
    message: "Owner menu fetched successfully",
    data,
  });
});

const createMenuCategoryController = asyncHandler(async (req, res) => {
  const data = await createMenuCategory(req.auth.userId, req.body);

  return sendResponse(res, {
    statusCode: 201,
    message: "Menu category created successfully",
    data,
  });
});

const createMenuItemController = asyncHandler(async (req, res) => {
  const data = await createMenuItem(req.auth.userId, req.body);

  return sendResponse(res, {
    statusCode: 201,
    message: "Menu item created successfully",
    data,
  });
});

const updateMenuItemController = asyncHandler(async (req, res) => {
  const data = await updateMenuItem(req.auth.userId, req.params.itemKey, req.body);

  return sendResponse(res, {
    message: "Menu item updated successfully",
    data,
  });
});

const toggleMenuItemStatusController = asyncHandler(async (req, res) => {
  const data = await toggleMenuItemStatus(req.auth.userId, req.params.itemKey, req.body);

  return sendResponse(res, {
    message: "Menu item status updated successfully",
    data,
  });
});

const deleteMenuItemController = asyncHandler(async (req, res) => {
  const data = await deleteMenuItem(req.auth.userId, req.params.itemKey);

  return sendResponse(res, {
    message: "Menu item deleted successfully",
    data,
  });
});

const getMyRestaurantOffersController = asyncHandler(async (req, res) => {
  const data = await getOwnedRestaurantOffers(req.auth.userId);

  return sendResponse(res, {
    message: "Owner offers fetched successfully",
    data,
  });
});

const createOfferController = asyncHandler(async (req, res) => {
  const data = await createOffer(req.auth.userId, req.body);

  return sendResponse(res, {
    statusCode: 201,
    message: "Offer created successfully",
    data,
  });
});

const updateOfferController = asyncHandler(async (req, res) => {
  const data = await updateOffer(req.auth.userId, req.params.offerId, req.body);

  return sendResponse(res, {
    message: "Offer updated successfully",
    data,
  });
});

const toggleOfferStatusController = asyncHandler(async (req, res) => {
  const data = await toggleOfferStatus(req.auth.userId, req.params.offerId, req.body);

  return sendResponse(res, {
    message: "Offer status updated successfully",
    data,
  });
});

const deleteOfferController = asyncHandler(async (req, res) => {
  const data = await deleteOffer(req.auth.userId, req.params.offerId);

  return sendResponse(res, {
    message: "Offer deleted successfully",
    data,
  });
});

module.exports = {
  createOfferController,
  createMenuCategoryController,
  createMenuItemController,
  createRestaurantController,
  deleteOfferController,
  deleteMenuItemController,
  getRestaurantList,
  getRestaurantById,
  getRestaurantMenuById,
  getMyRestaurant,
  getMyRestaurantOffersController,
  getMyRestaurantMenuController,
  toggleOfferStatusController,
  toggleMenuItemStatusController,
  updateMyRestaurantController,
  updateOfferController,
  updateMenuItemController,
};
