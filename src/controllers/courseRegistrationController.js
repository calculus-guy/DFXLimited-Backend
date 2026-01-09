const courseRegistrationService = require('../services/courseRegistrationService');

/**
 * Get user's course registrations
 */
const getUserRegistrations = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page, limit } = req.query;

    const result = await courseRegistrationService.getUserRegistrations(userId, { page, limit });

    res.status(200).json({
      success: true,
      message: 'Registrations retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get registration details
 */
const getRegistrationById = async (req, res, next) => {
  try {
    const registration = await courseRegistrationService.getRegistrationById(req.params.id);

    // Verify ownership
    if (registration.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this registration'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Registration retrieved successfully',
      data: { registration }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserRegistrations,
  getRegistrationById
};
