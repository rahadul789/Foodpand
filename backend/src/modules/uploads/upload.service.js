const crypto = require("node:crypto");

const { env } = require("../../config/env");
const { AppError } = require("../../common/utils/app-error");

const ALLOWED_SCOPES = new Set([
  "restaurant-logo",
  "restaurant-cover",
  "menu-item-image",
]);

function buildFolder(scope, userId) {
  const root = env.cloudinaryFolder || "foodpand";

  switch (scope) {
    case "restaurant-logo":
      return `${root}/restaurants/${userId}/logo`;
    case "restaurant-cover":
      return `${root}/restaurants/${userId}/cover`;
    case "menu-item-image":
      return `${root}/restaurants/${userId}/menu`;
    default:
      return `${root}/restaurants/${userId}/misc`;
  }
}

function buildPublicId(scope, entityId) {
  const suffix = entityId?.trim() || Date.now().toString();
  return `${scope}-${suffix}`.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function createCloudinarySignature(params) {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${serialized}${env.cloudinaryApiSecret}`)
    .digest("hex");
}

function createUploadSignature(user, payload = {}) {
  if (
    !env.cloudinaryCloudName ||
    !env.cloudinaryApiKey ||
    !env.cloudinaryApiSecret
  ) {
    throw new AppError("Cloudinary is not configured on the backend.", 500);
  }

  const scope = payload.scope?.trim();
  if (!ALLOWED_SCOPES.has(scope)) {
    throw new AppError("Upload scope is invalid.", 400);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = buildFolder(scope, String(user._id));
  const publicId = buildPublicId(scope, payload.entityId);
  const paramsToSign = {
    folder,
    public_id: publicId,
    timestamp,
  };

  return {
    cloudName: env.cloudinaryCloudName,
    apiKey: env.cloudinaryApiKey,
    timestamp,
    folder,
    publicId,
    resourceType: "image",
    signature: createCloudinarySignature(paramsToSign),
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`,
  };
}

module.exports = {
  createUploadSignature,
};
