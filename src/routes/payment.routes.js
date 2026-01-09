const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/initiate', paymentController.initiatePayment);

// Paystack webhook - no auth required, uses signature verification
router.post('/webhook', paymentController.handleWebhook);

// Verify payment status
router.get('/verify/:reference', paymentController.verifyPayment);

// Get payment by reference
router.get('/:reference', paymentController.getPayment);

module.exports = router;
