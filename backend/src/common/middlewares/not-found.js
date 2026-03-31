const { AppError } = require("../utils/app-error");

function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

module.exports = { notFoundHandler };
