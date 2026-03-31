const { AppError } = require("../utils/app-error");

function requireRole(...allowedRoles) {
  return function roleGuard(req, _res, next) {
    const role = req.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      return next(new AppError("You do not have permission for this action", 403));
    }

    return next();
  };
}

module.exports = {
  requireRole,
};
