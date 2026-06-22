const Order = require('../models/Order');
const Product = require('../models/Product');
const productService = require('./productService');
const emailService = require('./emailService');
const { logActivity } = require('./activityLogService');
const ApiError = require('../utils/ApiError');

const SHIPPING_RATES = {
  STANDARD: 150000,  // ₦1,500 in kobo
  EXPRESS: 300000,   // ₦3,000 in kobo
};
const FREE_SHIPPING_THRESHOLD = 5000000; // ₦50,000 in kobo — free standard shipping above this

const calculateShipping = (subtotalAmount, shippingMethod = 'STANDARD') => {
  if (shippingMethod === 'EXPRESS') {
    return { shippingMethod: 'EXPRESS', shippingAmount: SHIPPING_RATES.EXPRESS };
  }
  if (subtotalAmount >= FREE_SHIPPING_THRESHOLD) {
    return { shippingMethod: 'FREE', shippingAmount: 0 };
  }
  return { shippingMethod: 'STANDARD', shippingAmount: SHIPPING_RATES.STANDARD };
};

const createOrder = async (items, checkoutData, userId = null, shippingMethod = 'STANDARD') => {
  const productIds = items.map((item) => item.productId);
  
  const products = await productService.getProductsByIds(productIds);
  
  if (products.length !== productIds.length) {
    throw new ApiError(400, 'One or more products not found');
  }

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const orderItems = [];
  let subtotalAmount = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);
    
    if (!product) {
      throw new ApiError(400, `Product ${item.productId} not found`);
    }

    if (product.stockStatus === 'OUT_OF_STOCK') {
      throw new ApiError(400, `Product "${product.name}" is out of stock`);
    }

    if (product.stockQuantity < item.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}`
      );
    }

    const subtotal = product.price * item.quantity;
    
    orderItems.push({
      productId: product._id,
      productName: product.name,
      productPrice: product.price,
      quantity: item.quantity,
      subtotal,
    });

    subtotalAmount += subtotal;
  }

  // Calculate tax (7.5% VAT)
  const taxRate = 7.5;
  const taxAmount = Math.round((subtotalAmount * taxRate) / 100);

  // Calculate shipping
  const { shippingMethod: resolvedShippingMethod, shippingAmount } = calculateShipping(subtotalAmount, shippingMethod);

  const totalAmount = subtotalAmount + taxAmount + shippingAmount;

  // Create the order
  const order = await Order.create({
    userId,
    items: orderItems,
    subtotalAmount,
    taxAmount,
    taxRate,
    shippingMethod: resolvedShippingMethod,
    shippingAmount,
    totalAmount,
    checkoutData,
    status: 'PENDING',
  });

  // Log activity
  logActivity({
    action: 'ORDER_CREATED',
    actor: userId,
    actorType: userId ? 'USER' : 'GUEST',
    targetType: 'ORDER',
    targetId: order._id,
    metadata: { orderNumber: order.orderNumber, subtotalAmount, taxAmount, shippingAmount, totalAmount, itemCount: orderItems.length }
  });

  // Send order confirmation email
  try {
    await emailService.sendOrderConfirmation(order);
    await emailService.sendAdminNotification(order);
  } catch (error) {
    console.error('Failed to send order emails:', error.message);
  }

  return order;
};

const getOrderById = async (id, userId = null) => {
  const order = await Order.findById(id);
  
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // If userId provided, verify ownership
  if (userId && order.userId && order.userId.toString() !== userId) {
    throw new ApiError(403, 'You do not have access to this order');
  }

  return order;
};

const getOrderByNumber = async (orderNumber, email) => {
  const order = await Order.findOne({
    orderNumber,
    'checkoutData.email': email.toLowerCase(),
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  return order;
};

const getUserOrders = async (userId, pagination = {}) => {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Order.countDocuments({ userId }),
  ]);

  return {
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getAllOrders = async (filters = {}, pagination = {}) => {
  const { status } = filters;
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const query = {};
  if (status) {
    query.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const updateOrderStatus = async (id, status, adminId = null) => {
  const order = await Order.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Log activity based on status
  const actionMap = {
    'SHIPPED': 'ORDER_SHIPPED',
    'DELIVERED': 'ORDER_DELIVERED'
  };
  
  if (actionMap[status]) {
    logActivity({
      action: actionMap[status],
      actor: adminId,
      actorType: 'ADMIN',
      targetType: 'ORDER',
      targetId: order._id,
      metadata: { orderNumber: order.orderNumber, status }
    });
  }

  // Send email notifications based on status change
  if (status === 'SHIPPED') {
    try {
      await emailService.sendDispatchNotification(order);
    } catch (error) {
      console.error('Failed to send dispatch email:', error.message);
    }
  }

  if (status === 'DELIVERED') {
    try {
      await emailService.sendDeliveredNotification(order);
    } catch (error) {
      console.error('Failed to send delivered email:', error.message);
    }
  }

  return order;
};

const markOrderAsPaid = async (orderId, paymentRef) => {
  const order = await Order.findByIdAndUpdate(
    orderId,
    { status: 'PAID', paymentRef },
    { new: true }
  );

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Log activity
  logActivity({
    action: 'ORDER_PAID',
    actor: order.userId,
    actorType: order.userId ? 'USER' : 'GUEST',
    targetType: 'ORDER',
    targetId: order._id,
    metadata: { orderNumber: order.orderNumber, paymentRef, amount: order.totalAmount }
  });

  // Decrement stock for each item
  for (const item of order.items) {
    await productService.updateStock(item.productId, item.quantity);
  }

  return order;
};

/**
 * Admin: Manually mark order as paid (reconciliation)
 * Used for offline payments, bank transfers, etc.
 */
const adminMarkOrderPaid = async (orderId, adminId, reason = null) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status === 'PAID') {
    throw new ApiError(400, 'Order is already marked as paid');
  }

  if (order.status === 'CANCELLED') {
    throw new ApiError(400, 'Cannot mark a cancelled order as paid');
  }

  // Generate manual payment reference
  const manualRef = `MANUAL_${Date.now()}_${orderId.toString().slice(-6)}`;

  order.status = 'PAID';
  order.paymentRef = manualRef;
  await order.save();

  // Decrement stock for each item
  for (const item of order.items) {
    await productService.updateStock(item.productId, item.quantity);
  }

  // Log activity
  logActivity({
    action: 'ORDER_MANUALLY_PAID',
    actor: adminId,
    actorType: 'ADMIN',
    targetType: 'ORDER',
    targetId: order._id,
    metadata: { 
      orderNumber: order.orderNumber, 
      paymentRef: manualRef, 
      amount: order.totalAmount,
      reason: reason || 'Manual reconciliation'
    }
  });

  // Send payment receipt email
  try {
    await emailService.sendPaymentReceipt(order, { reference: manualRef, amount: order.totalAmount });
  } catch (error) {
    console.error('Failed to send payment receipt:', error.message);
  }

  return order;
};

/**
 * Admin: Mark order as refunded
 */
const adminMarkOrderRefunded = async (orderId, adminId, reason = null) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status === 'CANCELLED') {
    throw new ApiError(400, 'Order is already cancelled');
  }

  order.status = 'CANCELLED';
  await order.save();

  // Log activity
  logActivity({
    action: 'ORDER_REFUNDED',
    actor: adminId,
    actorType: 'ADMIN',
    targetType: 'ORDER',
    targetId: order._id,
    metadata: { 
      orderNumber: order.orderNumber, 
      amount: order.totalAmount,
      reason: reason || 'Manual refund'
    }
  });

  return order;
};

module.exports = {
  createOrder,
  getOrderById,
  getOrderByNumber,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  markOrderAsPaid,
  adminMarkOrderPaid,
  adminMarkOrderRefunded,
};
