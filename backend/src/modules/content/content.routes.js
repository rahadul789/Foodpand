const express = require("express");

const {
  getHomePayload,
  getDiscoverPayload,
  getCategoryList,
  getPromoList,
  getDiscoverFilterList,
} = require("./content.controller");

const contentRoutes = express.Router();

contentRoutes.get("/home", getHomePayload);
contentRoutes.get("/discover", getDiscoverPayload);
contentRoutes.get("/categories", getCategoryList);
contentRoutes.get("/promos", getPromoList);
contentRoutes.get("/filters", getDiscoverFilterList);

module.exports = { contentRoutes };
