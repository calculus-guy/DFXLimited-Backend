const tokenService = require('../services/tokenService');
const ApiError = require('../utils/ApiError');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Access token is required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = tokenService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token has expired'));
    }
    return next(new ApiError(401, 'Invalid access token'));
  }
};

// Export both as default and named export for compatibility
module.exports = authMiddleware;
module.exports.authenticate = authMiddleware;
