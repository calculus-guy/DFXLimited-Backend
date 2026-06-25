const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const CourseRegistration = require('../models/CourseRegistration');
const orderService = require('./orderService');
const { applyPromoCode } = require('./promoService');
const emailService = require('./emailService');
const { logActivity } = require('./activityLogService');
const { config } = require('../config');
const ApiError = require('../utils/ApiError');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const paystackApi = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${config.paystack.secretKey}`,
    'Content-Type': 'application/json',
  },
});

const initiatePayment = async (orderId) => {
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status !== 'PENDING') {
    throw new ApiError(400, 'Order is not in pending status');
  }

  const existingPayment = await Payment.findOne({ 
    orderId, 
    status: { $in: ['PENDING', 'SUCCESS'] } 
  });

  if (existingPayment && existingPayment.status === 'SUCCESS') {
    throw new ApiError(400, 'Order has already been paid');
  }

  const payment = await Payment.create({
    orderId: order._id,
    amount: order.totalAmount,
    type: 'PRODUCT',
    status: 'PENDING',
  });

  try {
    const response = await paystackApi.post('/transaction/initialize', {
      email: order.checkoutData.email,
      amount: order.totalAmount, // Already in kobo
      reference: payment.reference,
      callback_url: `${config.cors.origin[0]}/payment/verify`,
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentId: payment._id.toString(),
      },
    });

    // Update payment with Paystack reference
    payment.paystackReference = response.data.data.reference;
    payment.metadata = response.data.data;
    await payment.save();

    // Update order with payment reference
    order.paymentRef = payment.reference;
    await order.save();

    return {
      paymentUrl: response.data.data.authorization_url,
      reference: payment.reference,
      accessCode: response.data.data.access_code,
    };
  } catch (error) {
    // Mark payment as failed
    payment.status = 'FAILED';
    payment.metadata = { error: error.message };
    await payment.save();

    console.error('Paystack initialization error:', error.response?.data || error.message);
    throw new ApiError(500, 'Failed to initialize payment');
  }
};

const verifyWebhookSignature = (signature, body) => {
  const hash = crypto
    .createHmac('sha512', config.paystack.secretKey)
    .update(JSON.stringify(body))
    .digest('hex');

  return hash === signature;
};

const processWebhook = async (event) => {
  const { event: eventType, data } = event;

  // Only process charge.success events
  if (eventType !== 'charge.success') {
    console.log(`Ignoring webhook event: ${eventType}`);
    return { processed: false, reason: 'Event type not handled' };
  }

  const { reference, status } = data;

  // Find payment by reference (idempotency check)
  const payment = await Payment.findOne({ reference });

  if (!payment) {
    console.log(`Payment not found for reference: ${reference}`);
    return { processed: false, reason: 'Payment not found' };
  }

  // Idempotency: Skip if already processed
  if (payment.status === 'SUCCESS') {
    console.log(`Payment ${reference} already processed`);
    return { processed: false, reason: 'Already processed' };
  }

  if (status === 'success') {
    // Handle based on payment type
    if (payment.type === 'COURSE') {
      return processCoursePayment(payment, data);
    }

    // Handle PRODUCT payment (existing logic)
    payment.status = 'SUCCESS';
    payment.metadata = { ...payment.metadata, webhookData: data };
    await payment.save();

    // Mark order as paid and update stock
    const order = await orderService.markOrderAsPaid(payment.orderId, payment.reference);

    // Increment promo code usage if one was applied
    if (order.promoCode) {
      try {
        await applyPromoCode(order.promoCode);
      } catch (err) {
        console.error('Failed to increment promo usage:', err.message);
      }
    }

    // Send payment receipt email
    try {
      await emailService.sendPaymentReceipt(order, payment);
    } catch (error) {
      console.error('Failed to send payment receipt:', error.message);
    }

    // Log activity
    logActivity({
      action: 'PAYMENT_SUCCESS',
      actor: order.userId,
      actorType: order.userId ? 'USER' : 'GUEST',
      targetType: 'PAYMENT',
      targetId: payment._id,
      metadata: { reference, amount: payment.amount, orderId: order._id }
    });

    console.log(`Payment ${reference} processed successfully`);
    return { processed: true, orderId: order._id };
  } else {
    // Mark payment as failed
    payment.status = 'FAILED';
    payment.metadata = { ...payment.metadata, webhookData: data };
    await payment.save();

    // Log failed payment
    logActivity({
      action: 'PAYMENT_FAILED',
      actor: null,
      actorType: 'SYSTEM',
      targetType: 'PAYMENT',
      targetId: payment._id,
      metadata: { reference, reason: 'Payment failed' }
    });

    console.log(`Payment ${reference} failed`);
    return { processed: true, status: 'failed' };
  }
};

const verifyPayment = async (reference) => {
  try {
    const response = await paystackApi.get(`/transaction/verify/${reference}`);
    const paystackData = response.data.data;

    // If Paystack confirms success, ensure our DB is also updated
    // (fallback in case webhook was delayed or missed)
    if (paystackData.status === 'success') {
      const payment = await Payment.findOne({ reference });
      if (payment && payment.status !== 'SUCCESS') {
        if (payment.type === 'COURSE') {
          await processCoursePayment(payment, paystackData);
        } else {
          // Mark payment success and order as paid
          payment.status = 'SUCCESS';
          payment.metadata = { ...payment.metadata, verifiedAt: new Date() };
          await payment.save();
          const paidOrder = await orderService.markOrderAsPaid(payment.orderId, payment.reference);

          // Increment promo code usage if one was applied
          if (paidOrder.promoCode) {
            try {
              await applyPromoCode(paidOrder.promoCode);
            } catch (err) {
              console.error('Failed to increment promo usage on verify:', err.message);
            }
          }

          try {
            await emailService.sendPaymentReceipt(paidOrder, payment);
          } catch (e) {
            console.error('Failed to send payment receipt on verify:', e.message);
          }
        }
      }
    }

    return paystackData;
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    throw new ApiError(500, 'Failed to verify payment');
  }
};

const getPaymentByReference = async (reference) => {
  const payment = await Payment.findOne({ reference }).populate('orderId');
  
  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  return payment;
};

/**
 * Initiate payment for course registration
 */
const initiateCoursePayment = async (registration, course, user) => {
  // Check for existing payment
  const existingPayment = await Payment.findOne({
    courseRegistrationId: registration._id,
    status: { $in: ['PENDING', 'SUCCESS'] }
  });

  if (existingPayment && existingPayment.status === 'SUCCESS') {
    throw new ApiError(400, 'Course has already been paid for');
  }

  // Create payment record using totalAmount from registration (includes tax)
  const payment = await Payment.create({
    courseRegistrationId: registration._id,
    amount: registration.totalAmount, // Total amount including tax
    type: 'COURSE',
    status: 'PENDING'
  });

  try {
    const response = await paystackApi.post('/transaction/initialize', {
      email: user.email,
      amount: registration.totalAmount, // Already in kobo, includes tax
      reference: payment.reference,
      callback_url: `${config.cors.origin[0]}/course-payment/verify`,
      metadata: {
        courseRegistrationId: registration._id.toString(),
        courseId: course._id.toString(),
        courseName: course.title,
        paymentId: payment._id.toString(),
        userId: user._id.toString(),
        coursePrice: registration.coursePrice,
        taxAmount: registration.taxAmount,
        totalAmount: registration.totalAmount
      }
    });

    // Update payment with Paystack reference
    payment.paystackReference = response.data.data.reference;
    payment.metadata = response.data.data;
    await payment.save();

    // Update registration with payment reference
    registration.paymentRef = payment.reference;
    await registration.save();

    return {
      paymentUrl: response.data.data.authorization_url,
      reference: payment.reference,
      accessCode: response.data.data.access_code
    };
  } catch (error) {
    // Mark payment as failed
    payment.status = 'FAILED';
    payment.metadata = { error: error.message };
    await payment.save();

    console.error('Paystack initialization error:', error.response?.data || error.message);
    throw new ApiError(500, 'Failed to initialize payment');
  }
};

/**
 * Process course payment from webhook
 */
const processCoursePayment = async (payment, data) => {
  // Update payment status
  payment.status = 'SUCCESS';
  payment.metadata = { ...payment.metadata, webhookData: data };
  await payment.save();

  // Update registration status
  const registration = await CourseRegistration.findByIdAndUpdate(
    payment.courseRegistrationId,
    {
      status: 'ACTIVE',
      paidAt: new Date(),
      paymentRef: payment.reference
    },
    { new: true }
  ).populate('courseId').populate('userId', 'name email');

  // Send course payment receipt email
  try {
    await emailService.sendCoursePaymentReceipt(registration, registration.courseId, payment);
    await emailService.sendAdminCourseRegistrationAlert(registration, registration.courseId, registration.userId);
  } catch (error) {
    console.error('Failed to send course payment emails:', error.message);
  }

  // Log activity
  logActivity({
    action: 'COURSE_PAYMENT',
    actor: registration.userId._id,
    actorType: 'USER',
    targetType: 'PAYMENT',
    targetId: payment._id,
    metadata: { 
      reference: payment.reference, 
      amount: payment.amount, 
      courseId: registration.courseId._id,
      courseName: registration.courseId.title
    }
  });

  console.log(`Course payment ${payment.reference} processed successfully`);
  return { processed: true, registrationId: registration._id };
};

module.exports = {
  initiatePayment,
  initiateCoursePayment,
  verifyWebhookSignature,
  processWebhook,
  verifyPayment,
  getPaymentByReference,
  processCoursePayment
};