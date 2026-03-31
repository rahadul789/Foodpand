const { sendResponse } = require("../../common/utils/api-response");
const { asyncHandler } = require("../../common/utils/async-handler");
const {
  assignDeliveryPartner,
  cancelOrder,
  createOrder,
  getOrderDetails,
  getOrderQuote,
  listAssignedDeliveryOrders,
  listActiveOrders,
  listAvailableDeliveryOrders,
  listOrderHistory,
  listRestaurantOwnerOrders,
  updatePreparationWindow,
  updateOrderStatus,
} = require("./order.service");

const getOrderQuoteController = asyncHandler(async (req, res) => {
  const data = await getOrderQuote(req.body);

  return sendResponse(res, {
    message: "Order quote calculated successfully",
    data,
  });
});

const createOrderController = asyncHandler(async (req, res) => {
  const data = await createOrder(req.auth.userId, req.body);

  return sendResponse(res, {
    statusCode: 201,
    message: "Order placed successfully",
    data,
  });
});

const listActiveOrdersController = asyncHandler(async (req, res) => {
  const data = await listActiveOrders(req.auth.userId);

  return sendResponse(res, {
    message: "Active orders fetched successfully",
    data,
  });
});

const listOrderHistoryController = asyncHandler(async (req, res) => {
  const data = await listOrderHistory(req.auth.userId);

  return sendResponse(res, {
    message: "Order history fetched successfully",
    data,
  });
});

const listRestaurantOwnerOrdersController = asyncHandler(async (req, res) => {
  const data = await listRestaurantOwnerOrders(req.auth.userId);

  return sendResponse(res, {
    message: "Restaurant owner orders fetched successfully",
    data,
  });
});

const listAvailableDeliveryOrdersController = asyncHandler(async (_req, res) => {
  const data = await listAvailableDeliveryOrders();

  return sendResponse(res, {
    message: "Available delivery orders fetched successfully",
    data,
  });
});

const listAssignedDeliveryOrdersController = asyncHandler(async (req, res) => {
  const data = await listAssignedDeliveryOrders(req.auth.userId);

  return sendResponse(res, {
    message: "Assigned delivery orders fetched successfully",
    data,
  });
});

const getOrderDetailsController = asyncHandler(async (req, res) => {
  const data = await getOrderDetails(req.auth.userId, req.params.orderId);

  return sendResponse(res, {
    message: "Order details fetched successfully",
    data,
  });
});

const cancelOrderController = asyncHandler(async (req, res) => {
  const data = await cancelOrder(req.auth.userId, req.params.orderId);

  return sendResponse(res, {
    message: "Order cancelled successfully",
    data,
  });
});

const updateOrderStatusController = asyncHandler(async (req, res) => {
  const data = await updateOrderStatus(req.user, req.params.orderId, req.body);

  return sendResponse(res, {
    message: "Order status updated successfully",
    data,
  });
});

const updatePreparationWindowController = asyncHandler(async (req, res) => {
  const data = await updatePreparationWindow(req.user, req.params.orderId, req.body);

  return sendResponse(res, {
    message: "Preparation time updated successfully",
    data,
  });
});

const assignDeliveryPartnerController = asyncHandler(async (req, res) => {
  const data = await assignDeliveryPartner(req.user, req.params.orderId);

  return sendResponse(res, {
    message: "Delivery task accepted successfully",
    data,
  });
});

module.exports = {
  assignDeliveryPartnerController,
  cancelOrderController,
  createOrderController,
  getOrderDetailsController,
  getOrderQuoteController,
  listActiveOrdersController,
  listAssignedDeliveryOrdersController,
  listAvailableDeliveryOrdersController,
  listOrderHistoryController,
  listRestaurantOwnerOrdersController,
  updatePreparationWindowController,
  updateOrderStatusController,
};
