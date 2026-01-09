const userManagementService = require('../services/userManagementService');
const ApiError = require('../utils/ApiError');

/**
 * Get all users with filtering
 * GET /api/admin/users
 */
const getAll = async (req, res, next) => {
  try {
    const { role, isActive, search, page, limit } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const pagination = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    };

    const result = await userManagementService.getAllUsers(filters, pagination);

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userManagementService.getUserById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search users
 * GET /api/admin/users/search
 */
const search = async (req, res, next) => {
  try {
    const { q, limit } = req.query;

    if (!q || q.length < 2) {
      throw new ApiError(400, 'Search query must be at least 2 characters');
    }

    const users = await userManagementService.searchUsers(q, parseInt(limit) || 10);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 * GET /api/admin/users/stats
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await userManagementService.getUserStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  search,
  getStats
};
