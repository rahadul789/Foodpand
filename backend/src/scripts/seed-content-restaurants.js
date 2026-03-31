const { connectDatabase, mongoose } = require("../config/database");
const {
  Category,
  QuickPick,
  Promo,
  DiscoverFilter,
} = require("../modules/content/content.model");
const { Restaurant } = require("../modules/restaurants/restaurant.model");
const { contentSeed, restaurantSeed } = require("../data/seed-data");

function enrichRestaurantSeed(restaurant) {
  const parts = restaurant.deliveryTime.match(/\d+/g)?.map(Number) ?? [];
  const deliveryMinMinutes = parts.length ? Math.min(...parts) : 0;
  const deliveryMaxMinutes = parts.length ? Math.max(...parts) : 0;

  return {
    ...restaurant,
    deliveryMinMinutes,
    deliveryMaxMinutes,
  };
}

async function seed() {
  try {
    await connectDatabase();

    await Promise.all([
      Category.deleteMany({}),
      QuickPick.deleteMany({}),
      Promo.deleteMany({}),
      DiscoverFilter.deleteMany({}),
      Restaurant.deleteMany({}),
    ]);

    await Promise.all([
      Category.insertMany(contentSeed.categories),
      QuickPick.insertMany(contentSeed.quickPicks),
      Promo.insertMany(contentSeed.promos),
      DiscoverFilter.insertMany(contentSeed.discoverFilters),
      Restaurant.insertMany(restaurantSeed.map(enrichRestaurantSeed)),
    ]);

    console.log("[seed] Content and restaurants seeded successfully");
  } catch (error) {
    console.error("[seed] Failed to seed content/restaurants", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seed();
