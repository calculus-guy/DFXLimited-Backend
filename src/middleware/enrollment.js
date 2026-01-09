const courseRegistrationService = require('../services/courseRegistrationService');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to verify user is enrolled in a course
 * Requires auth middleware to run first (req.user must exist)
 * Expects courseId in req.params
 */
const verifyEnrollment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    if (!courseId) {
      throw new ApiError(400, 'Course ID is required');
    }

    const isEnrolled = await courseRegistrationService.isUserEnrolled(userId, courseId);

    if (!isEnrolled) {
      throw new ApiError(403, 'You must be enrolled in this course to access materials');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyEnrollment
};
