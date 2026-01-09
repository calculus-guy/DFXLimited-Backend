const express = require('express');
const orderController = require('../../controllers/orderController');
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');
const validate = require('../../middleware/validate');
const { updateStatusSchema } = require('../../validators/order.validator');

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/', orderController.getAllOrders);
router.put('/:id/status', validate(updateStatusSchema), orderController.updateOrderStatus);

module.exports = router;
