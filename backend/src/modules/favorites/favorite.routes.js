const express = require("express");

const { requireAuth } = require("../../common/middlewares/auth");
const {
  addFavoriteController,
  listFavoritesController,
  removeFavoriteController,
} = require("./favorite.controller");

const favoriteRoutes = express.Router();

favoriteRoutes.use(requireAuth);

favoriteRoutes.get("/", listFavoritesController);
favoriteRoutes.post("/:restaurantId", addFavoriteController);
favoriteRoutes.delete("/:restaurantId", removeFavoriteController);

module.exports = {
  favoriteRoutes,
};
