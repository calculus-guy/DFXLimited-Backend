const express = require('express');
const productController = require('../../controllers/productController');
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');
const validate = require('../../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../../validators/product.validator');

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.post('/', validate(createProductSchema), productController.createProduct);
router.put('/:id', validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
