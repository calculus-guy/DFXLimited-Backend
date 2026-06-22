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
const reviewRoutes = require('./review.routes');
const promoRoutes = require('./promo.routes');

// Admin routes
const adminProductRoutes = require('./admin/product.routes');
const adminOrderRoutes = require('./admin/order.routes');
const adminCourseRoutes = require('./admin/course.routes');
const adminContactRoutes = require('./admin/contact.routes');
const adminProjectRoutes = require('./admin/project.routes');
const adminDashboardRoutes = require('./admin/dashboard.routes');
const adminActivityLogRoutes = require('./admin/activityLog.routes');
const adminUserRoutes = require('./admin/user.routes');
const adminReconciliationRoutes = require('./admin/reconciliation.routes');

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
router.use('/reviews', reviewRoutes);
router.use('/promos', promoRoutes);

// Admin routes
router.use('/admin/products', adminProductRoutes);
router.use('/admin/orders', adminOrderRoutes);
router.use('/admin/courses', adminCourseRoutes);
router.use('/admin/contacts', adminContactRoutes);
router.use('/admin/projects', adminProjectRoutes);
router.use('/admin/dashboard', adminDashboardRoutes);
router.use('/admin/activity-logs', adminActivityLogRoutes);
router.use('/admin/users', adminUserRoutes);
router.use('/admin/reconciliation', adminReconciliationRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
