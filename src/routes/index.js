const express = require('express');
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const uploadRoutes = require('./upload.routes');
const courseRoutes = require('./course.routes');
const userRoutes = require('./user.routes');

// Admin routes
const adminProductRoutes = require('./admin/product.routes');
const adminOrderRoutes = require('./admin/order.routes');
const adminCourseRoutes = require('./admin/course.routes');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DFX Backend API is running',
    timestamp: new Date().toISOString(),
  });
});

// Public routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/courses', courseRoutes);
router.use('/users', userRoutes);

// Admin routes
router.use('/admin/products', adminProductRoutes);
router.use('/admin/orders', adminOrderRoutes);
router.use('/admin/courses', adminCourseRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
