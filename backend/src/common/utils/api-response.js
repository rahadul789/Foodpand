function sendResponse(res, payload = {}) {
  const {
    statusCode = 200,
    success = true,
    message = "Request successful",
    data = null,
    meta = undefined,
  } = payload;

  return res.status(statusCode).json({
    success,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}

module.exports = { sendResponse };
