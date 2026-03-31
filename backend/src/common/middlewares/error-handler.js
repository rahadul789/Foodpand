function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { errorHandler };
