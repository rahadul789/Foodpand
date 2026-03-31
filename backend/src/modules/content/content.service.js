const {
  Category,
  QuickPick,
  Promo,
  DiscoverFilter,
} = require("./content.model");

async function getCategories() {
  return Category.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
}

async function getQuickPicks() {
  return QuickPick.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
}

async function getPromos() {
  return Promo.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
}

async function getDiscoverFilters() {
  return DiscoverFilter.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
}

async function getHomeContent() {
  const [categories, quickPicks, promos] = await Promise.all([
    getCategories(),
    getQuickPicks(),
    getPromos(),
  ]);

  return {
    categories,
    quickPicks,
    promos,
  };
}

async function getDiscoverContent() {
  const [categories, filters] = await Promise.all([
    getCategories(),
    getDiscoverFilters(),
  ]);

  return {
    categories,
    filters,
  };
}

module.exports = {
  getCategories,
  getQuickPicks,
  getPromos,
  getDiscoverFilters,
  getHomeContent,
  getDiscoverContent,
};
