const activityLogService = require('../services/activityLogService');

/**
 * Get all activity logs with filtering
 * GET /api/admin/activity-logs
 */
const getAll = async (req, res, next) => {
  try {
    const { action, actorType, targetType, startDate, endDate, page, limit } = req.query;

    const filters = {};
    if (action) filters.action = action;
    if (actorType) filters.actorType = actorType;
    if (targetType) filters.targetType = targetType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const pagination = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    };

    const result = await activityLogService.getActivityLogs(filters, pagination);

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activity
 * GET /api/admin/activity-logs/recent
 */
const getRecent = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const logs = await activityLogService.getRecentActivity(limit);

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getRecent
};
