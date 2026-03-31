const { asyncHandler } = require("../../common/utils/async-handler");
const { sendResponse } = require("../../common/utils/api-response");
const {
  addFavorite,
  listFavorites,
  removeFavorite,
} = require("./favorite.service");

const listFavoritesController = asyncHandler(async (req, res) => {
  const data = await listFavorites(req.auth.userId);

  return sendResponse(res, {
    message: "Favorites fetched successfully",
    data,
  });
});

const addFavoriteController = asyncHandler(async (req, res) => {
  const data = await addFavorite(req.auth.userId, req.params.restaurantId);

  return sendResponse(res, {
    message: "Restaurant added to favorites",
    data,
  });
});

const removeFavoriteController = asyncHandler(async (req, res) => {
  const data = await removeFavorite(req.auth.userId, req.params.restaurantId);

  return sendResponse(res, {
    message: "Restaurant removed from favorites",
    data,
  });
});

module.exports = {
  addFavoriteController,
  listFavoritesController,
  removeFavoriteController,
};
