const mongoose = require("mongoose");

const { env } = require("./env");

async function connectDatabase() {
  if (!env.mongodbUri) {
    console.warn("[database] MONGODB_URI is not configured. Starting without database connection.");
    return;
  }

  await mongoose.connect(env.mongodbUri);
  console.log("[database] MongoDB connected");
}

module.exports = {
  connectDatabase,
  mongoose,
};
