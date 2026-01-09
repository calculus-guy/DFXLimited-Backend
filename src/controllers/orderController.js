const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const catchAsync = require('../utils/catchAsync');

const checkout = catchAsync(async (req, res) => {
  const { items, checkoutData } = req.body;
  const userId = req.user?.userId || null;

  // Create order
  const order = await orderService.createOrder(items, checkoutData, userId);

  // Initiate payment
  const paymentData = await paymentService.initiatePayment(order._id);

  res.status(201).json({
    success: true,
    data: {
      order,
      paymentUrl: paymentData.paymentUrl,
      paymentReference: paymentData.reference,
    },
  });
});

const getOrder = catchAsync(async (req, res) => {
  const userId = req.user?.userId || null;
  const order = await orderService.getOrderById(req.params.id, userId);

  res.status(200).json({
    success: true,
    data: { order },
  });
});

const lookupOrder = catchAsync(async (req, res) => {
  const { orderNumber, email } = req.body;
  const order = await orderService.getOrderByNumber(orderNumber, email);

  res.status(200).json({
    success: true,
    data: { order },
  });
});

const getUserOrders = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await orderService.getUserOrders(req.user.userId, { page, limit });

  res.status(200).json({
    success: true,
    data: result,
  });
});

// Admin controllers
const getAllOrders = catchAsync(async (req, res) => {
  const { page, limit, status } = req.query;
  const result = await orderService.getAllOrders({ status }, { page, limit });

  res.status(200).json({
    success: true,
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const adminId = req.user.userId;
  const order = await orderService.updateOrderStatus(req.params.id, status, adminId);

  res.status(200).json({
    success: true,
    data: { order },
  });
});

module.exports = {
  checkout,
  getOrder,
  lookupOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
};
