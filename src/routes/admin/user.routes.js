const express = require('express');
const userController = require('../../controllers/userController');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/role');
const validate = require('../../middleware/validate');
const { userListFilters, userSearch } = require('../../validators/admin.validator');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/users/search - Search users (must be before /:id)
router.get('/search', validate(userSearch, 'query'), userController.search);

// GET /api/admin/users/stats - Get user statistics
router.get('/stats', userController.getStats);

// GET /api/admin/users - Get all users with filtering
router.get('/', validate(userListFilters, 'query'), userController.getAll);

// GET /api/admin/users/:id - Get user by ID
router.get('/:id', userController.getById);

module.exports = router;