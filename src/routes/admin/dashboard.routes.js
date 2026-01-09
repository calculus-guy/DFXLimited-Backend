const express = require('express');
const dashboardController = require('../../controllers/dashboardController');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/role');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/', dashboardController.getStats);

// GET /api/admin/dashboard/revenue - Get revenue statistics
router.get('/revenue', dashboardController.getRevenueStats);

module.exports = router;
