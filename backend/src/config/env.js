const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "*",
  mongodbUri: process.env.MONGODB_URI || "",
  jwtSecret:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production" ? "" : "foodpand-dev-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "foodpand",
};

module.exports = { env };
