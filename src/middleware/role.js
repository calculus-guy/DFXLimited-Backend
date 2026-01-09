const ApiError = require('../utils/ApiError');

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    // Normalize role comparison (handle both 'admin' and 'ADMIN')
    const userRole = req.user.role.toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return next(new ApiError(403, 'You do not have permission to access this resource'));
    }

    next();
  };
};

// Convenience middleware for admin-only routes
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (req.user.role.toUpperCase() !== 'ADMIN') {
    return next(new ApiError(403, 'Admin access required'));
  }

  next();
};

// Named export for requireRole (alias for roleMiddleware)
const requireRole = roleMiddleware;

module.exports = roleMiddleware;
module.exports.requireRole = requireRole;
module.exports.requireAdmin = requireAdmin;
