const { asyncHandler } = require("../../common/utils/async-handler");
const { sendResponse } = require("../../common/utils/api-response");
const {
  getCategories,
  getPromos,
  getDiscoverFilters,
  getHomeContent,
  getDiscoverContent,
} = require("./content.service");

const getHomePayload = asyncHandler(async (_req, res) => {
  const data = await getHomeContent();

  return sendResponse(res, {
    message: "Home content fetched successfully",
    data,
  });
});

const getDiscoverPayload = asyncHandler(async (_req, res) => {
  const data = await getDiscoverContent();

  return sendResponse(res, {
    message: "Discover content fetched successfully",
    data,
  });
});

const getCategoryList = asyncHandler(async (_req, res) => {
  const data = await getCategories();

  return sendResponse(res, {
    message: "Categories fetched successfully",
    data,
  });
});

const getPromoList = asyncHandler(async (_req, res) => {
  const data = await getPromos();

  return sendResponse(res, {
    message: "Promos fetched successfully",
    data,
  });
});

const getDiscoverFilterList = asyncHandler(async (_req, res) => {
  const data = await getDiscoverFilters();

  return sendResponse(res, {
    message: "Discover filters fetched successfully",
    data,
  });
});

module.exports = {
  getHomePayload,
  getDiscoverPayload,
  getCategoryList,
  getPromoList,
  getDiscoverFilterList,
};
