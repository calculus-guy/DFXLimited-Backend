const ActivityLog = require('../models/ActivityLog');

/**
 * Log an activity (fire and forget - non-blocking)
 */
const logActivity = async ({ action, actor, actorType, targetType, targetId, metadata, ipAddress }) => {
  try {
    await ActivityLog.create({
      action,
      actor: actor || null,
      actorType: actorType || 'SYSTEM',
      targetType,
      targetId,
      metadata: metadata || {},
      ipAddress: ipAddress || null
    });
  } catch (error) {
    // Log error but don't throw - activity logging should not break main flow
    console.error('Activity log error:', error.message);
  }
};

/**
 * Get activity logs with filtering and pagination
 */
const getActivityLogs = async (filters = {}, pagination = {}) => {
  const { action, actorType, targetType, startDate, endDate } = filters;
  const { page = 1, limit = 20 } = pagination;

  const query = {};

  if (action) {
    query.action = action;
  }

  if (actorType) {
    query.actorType = actorType;
  }

  if (targetType) {
    query.targetType = targetType;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    ActivityLog.find(query)
      .populate('actor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ActivityLog.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get recent activity (last N entries)
 */
const getRecentActivity = async (limit = 20) => {
  const logs = await ActivityLog.find()
    .populate('actor', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return logs;
};

/**
 * Get activity for a specific target
 */
const getTargetActivity = async (targetType, targetId) => {
  const logs = await ActivityLog.find({ targetType, targetId })
    .populate('actor', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return logs;
};

module.exports = {
  logActivity,
  getActivityLogs,
  getRecentActivity,
  getTargetActivity
};
