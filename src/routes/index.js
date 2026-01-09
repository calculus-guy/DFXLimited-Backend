const express = require('express');
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const uploadRoutes = require('./upload.routes');
const courseRoutes = require('./course.routes');
const userRoutes = require('./user.routes');
const contactRoutes = require('./contact.routes');
const projectRoutes = require('./project.routes');

// Admin routes
const adminProductRoutes = require('./admin/product.routes');
const adminOrderRoutes = require('./admin/order.routes');
const adminCourseRoutes = require('./admin/course.routes');
const adminContactRoutes = require('./admin/contact.routes');
const adminProjectRoutes = require('./admin/project.routes');

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
router.use('/contact', contactRoutes);
router.use('/projects', projectRoutes);

// Admin routes
router.use('/admin/products', adminProductRoutes);
router.use('/admin/orders', adminOrderRoutes);
router.use('/admin/courses', adminCourseRoutes);
router.use('/admin/contacts', adminContactRoutes);
router.use('/admin/projects', adminProjectRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
