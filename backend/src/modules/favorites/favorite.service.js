const { Types } = require("mongoose");

const { AppError } = require("../../common/utils/app-error");
const { Restaurant } = require("../restaurants/restaurant.model");
const { Favorite } = require("./favorite.model");

function validateRestaurantId(restaurantId) {
  if (!Types.ObjectId.isValid(restaurantId)) {
    throw new AppError("Restaurant not found", 404);
  }
}

async function ensureRestaurantExists(restaurantId) {
  validateRestaurantId(restaurantId);

  const restaurant = await Restaurant.findOne({
    _id: restaurantId,
    isActive: true,
  })
    .select("_id")
    .lean();

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }
}

async function listFavorites(userId) {
  const favorites = await Favorite.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
  const restaurantIds = favorites.map((favorite) => String(favorite.restaurantId));

  if (!restaurantIds.length) {
    return {
      favoriteIds: [],
      restaurants: [],
    };
  }

  const restaurants = await Restaurant.find({
    _id: { $in: restaurantIds },
    isActive: true,
  })
    .select("-menuItems -menuCategories")
    .lean();

  const restaurantMap = new Map(
    restaurants.map((restaurant) => [String(restaurant._id), restaurant]),
  );

  return {
    favoriteIds: restaurantIds.filter((id) => restaurantMap.has(id)),
    restaurants: restaurantIds
      .map((id) => restaurantMap.get(id))
      .filter(Boolean),
  };
}

async function addFavorite(userId, restaurantId) {
  await ensureRestaurantExists(restaurantId);

  await Favorite.findOneAndUpdate(
    { userId, restaurantId },
    { $setOnInsert: { userId, restaurantId } },
    { upsert: true, new: true },
  );

  return listFavorites(userId);
}

async function removeFavorite(userId, restaurantId) {
  validateRestaurantId(restaurantId);

  await Favorite.deleteOne({ userId, restaurantId });
  return listFavorites(userId);
}

module.exports = {
  addFavorite,
  listFavorites,
  removeFavorite,
};
