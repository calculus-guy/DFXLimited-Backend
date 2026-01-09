const express = require('express');
const activityLogController = require('../../controllers/activityLogController');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/role');
const validate = require('../../middleware/validate');
const { activityLogFilters } = require('../../validators/admin.validator');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/activity-logs/recent - Get recent activity (must be before /:id)
router.get('/recent', activityLogController.getRecent);

// GET /api/admin/activity-logs - Get all activity logs with filtering
router.get('/', validate(activityLogFilters, 'query'), activityLogController.getAll);

module.exports = router;
