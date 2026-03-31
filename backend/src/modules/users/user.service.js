const { AppError } = require("../../common/utils/app-error");
const { User } = require("./user.model");
const { sanitizeUser } = require("../auth/auth.service");

async function getCurrentUser(userId) {
  const user = await User.findOne({
    _id: userId,
    isActive: true,
  }).lean();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return sanitizeUser(user);
}

module.exports = {
  getCurrentUser,
};
