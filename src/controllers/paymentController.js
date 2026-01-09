const paymentService = require('../services/paymentService');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

const initiatePayment = catchAsync(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    throw new ApiError(400, 'Order ID is required');
  }

  const paymentData = await paymentService.initiatePayment(orderId);

  res.status(200).json({
    success: true,
    data: paymentData,
  });
});

const handleWebhook = catchAsync(async (req, res) => {
  const signature = req.headers['x-paystack-signature'];

  // Verify webhook signature
  if (!signature || !paymentService.verifyWebhookSignature(signature, req.body)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid signature' },
    });
  }

  // Process the webhook
  try {
    const result = await paymentService.processWebhook(req.body);
    console.log('Webhook processed:', result);
  } catch (error) {
    console.error('Webhook processing error:', error.message);
    // Still return 200 to acknowledge receipt
  }

  // Always return 200 to Paystack
  res.status(200).json({ success: true });
});

const verifyPayment = catchAsync(async (req, res) => {
  const { reference } = req.params;

  const paymentData = await paymentService.verifyPayment(reference);

  res.status(200).json({
    success: true,
    data: paymentData,
  });
});

const getPayment = catchAsync(async (req, res) => {
  const { reference } = req.params;

  const payment = await paymentService.getPaymentByReference(reference);

  res.status(200).json({
    success: true,
    data: { payment },
  });
});

module.exports = {
  initiatePayment,
  handleWebhook,
  verifyPayment,
  getPayment,
};
