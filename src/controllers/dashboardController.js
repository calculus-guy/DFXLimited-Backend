const analyticsService = require('../services/analyticsService');

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue statistics
 * GET /api/admin/dashboard/revenue
 */
const getRevenueStats = async (req, res, next) => {
  try {
    const { period } = req.query;
    const [revenue, trend] = await Promise.all([
      analyticsService.getRevenueStats(period),
      analyticsService.getRevenueTrend()
    ]);

    res.status(200).json({
      success: true,
      data: {
        revenue,
        trend
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getRevenueStats
};
