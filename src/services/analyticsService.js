const User = require('../models/User');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Course = require('../models/Course');
const CourseRegistration = require('../models/CourseRegistration');
const ContactMessage = require('../models/ContactMessage');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');

/**
 * Get dashboard overview statistics
 */
const getDashboardStats = async () => {
  const [
    totalUsers,
    totalOrders,
    totalProducts,
    totalCourses,
    totalContacts,
    totalProjects,
    orderStats,
    registrationStats,
    contactStats,
    recentActivity
  ] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    Order.countDocuments(),
    Product.countDocuments({ isDeleted: { $ne: true } }),
    Course.countDocuments({ isDeleted: { $ne: true } }),
    ContactMessage.countDocuments(),
    Project.countDocuments({ isDeleted: { $ne: true } }),
    getOrderStatusCounts(),
    getRegistrationStatusCounts(),
    getContactStatusCounts(),
    ActivityLog.find()
      .populate('actor', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
  ]);

  return {
    overview: {
      totalUsers,
      totalOrders,
      totalProducts,
      totalCourses,
      totalContacts,
      totalProjects
    },
    orders: orderStats,
    courseRegistrations: registrationStats,
    contacts: contactStats,
    recentActivity
  };
};

/**
 * Get order status counts
 */
const getOrderStatusCounts = async () => {
  const result = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const counts = {
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    total: 0
  };

  result.forEach(item => {
    const status = item._id.toLowerCase();
    if (counts.hasOwnProperty(status)) {
      counts[status] = item.count;
    }
    counts.total += item.count;
  });

  return counts;
};

/**
 * Get course registration status counts
 */
const getRegistrationStatusCounts = async () => {
  const result = await CourseRegistration.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const counts = {
    pending: 0,
    paid: 0,
    active: 0,
    expired: 0,
    total: 0
  };

  result.forEach(item => {
    const status = item._id.toLowerCase();
    if (counts.hasOwnProperty(status)) {
      counts[status] = item.count;
    }
    counts.total += item.count;
  });

  return counts;
};

/**
 * Get contact message status counts
 */
const getContactStatusCounts = async () => {
  const result = await ContactMessage.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const counts = {
    new: 0,
    read: 0,
    replied: 0,
    total: 0
  };

  result.forEach(item => {
    const status = item._id.toLowerCase();
    if (counts.hasOwnProperty(status)) {
      counts[status] = item.count;
    }
    counts.total += item.count;
  });

  return counts;
};

/**
 * Get revenue statistics
 */
const getRevenueStats = async (period = 'all') => {
  const now = new Date();
  let startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Get total revenue from successful payments
  const [totalRevenue, thisMonthRevenue, lastMonthRevenue] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Payment.aggregate([
      { 
        $match: { 
          status: 'SUCCESS',
          createdAt: { $gte: startOfThisMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Payment.aggregate([
      { 
        $match: { 
          status: 'SUCCESS',
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  // Revenue by type (ORDER vs COURSE)
  const revenueByType = await Payment.aggregate([
    { $match: { status: 'SUCCESS' } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } }
  ]);

  const byType = {
    orders: 0,
    courses: 0
  };

  revenueByType.forEach(item => {
    if (item._id === 'ORDER') byType.orders = item.total;
    if (item._id === 'COURSE') byType.courses = item.total;
  });

  return {
    total: totalRevenue[0]?.total || 0,
    thisMonth: thisMonthRevenue[0]?.total || 0,
    lastMonth: lastMonthRevenue[0]?.total || 0,
    byType
  };
};

/**
 * Get monthly revenue trend (last 6 months)
 */
const getRevenueTrend = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const trend = await Payment.aggregate([
    {
      $match: {
        status: 'SUCCESS',
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  return trend.map(item => ({
    year: item._id.year,
    month: item._id.month,
    total: item.total,
    count: item.count
  }));
};

module.exports = {
  getDashboardStats,
  getRevenueStats,
  getRevenueTrend,
  getOrderStatusCounts,
  getRegistrationStatusCounts,
  getContactStatusCounts
};
