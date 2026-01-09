const User = require('../models/User');
const Order = require('../models/Order');
const CourseRegistration = require('../models/CourseRegistration');

/**
 * Get all users with filtering and pagination
 */
const getAllUsers = async (filters = {}, pagination = {}) => {
  const { role, isActive, search } = filters;
  const { page = 1, limit = 20 } = pagination;

  const query = { isDeleted: { $ne: true } };

  if (role) {
    query.role = role;
  }

  if (typeof isActive === 'boolean') {
    query.isActive = isActive;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get user by ID with related data
 */
const getUserById = async (userId) => {
  const user = await User.findOne({ 
    _id: userId, 
    isDeleted: { $ne: true } 
  })
    .select('-password -refreshTokens')
    .lean();

  if (!user) {
    return null;
  }

  // Get user's orders and registrations count
  const [ordersCount, registrationsCount] = await Promise.all([
    Order.countDocuments({ userId }),
    CourseRegistration.countDocuments({ userId })
  ]);

  return {
    ...user,
    stats: {
      ordersCount,
      registrationsCount
    }
  };
};

/**
 * Search users by name or email
 */
const searchUsers = async (query, limit = 10) => {
  const users = await User.find({
    isDeleted: { $ne: true },
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  })
    .select('name email role createdAt')
    .limit(limit)
    .lean();

  return users;
};

/**
 * Get user statistics
 */
const getUserStats = async () => {
  const [total, admins, activeUsers, newThisMonth] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    User.countDocuments({ role: 'ADMIN', isDeleted: { $ne: true } }),
    User.countDocuments({ isActive: true, isDeleted: { $ne: true } }),
    User.countDocuments({
      isDeleted: { $ne: true },
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    })
  ]);

  return {
    total,
    admins,
    activeUsers,
    newThisMonth
  };
};

module.exports = {
  getAllUsers,
  getUserById,
  searchUsers,
  getUserStats
};
