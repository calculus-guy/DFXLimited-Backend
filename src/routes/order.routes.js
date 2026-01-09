const express = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { checkoutSchema, lookupOrderSchema } = require('../validators/order.validator');

const router = express.Router();

// Public/Guest routes
router.post('/checkout', validate(checkoutSchema), orderController.checkout);
router.post('/lookup', validate(lookupOrderSchema), orderController.lookupOrder);

// Protected routes (optional auth for checkout, required for my-orders)
router.get('/my-orders', authMiddleware, orderController.getUserOrders);
router.get('/:id', orderController.getOrder);

module.exports = router;