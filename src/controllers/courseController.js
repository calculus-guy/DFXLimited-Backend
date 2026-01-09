const courseService = require('../services/courseService');
const courseRegistrationService = require('../services/courseRegistrationService');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');

/**
 * Get all available courses (public)
 */
const getAll = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await courseService.getAvailableCourses({ page, limit });

    res.status(200).json({
      success: true,
      message: 'Courses retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get course by ID (public)
 */
const getById = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course retrieved successfully',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register for a course (auth required)
 */
const register = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const courseId = req.params.id;

    // Register for course
    const { registration, course, isReactivated } = await courseRegistrationService.registerForCourse(
      userId,
      courseId
    );

    // Get user details for email and payment
    const user = await require('../services/authService').getUserById(userId);

    // Send registration confirmation email
    emailService.sendCourseRegistrationConfirmation(registration, course, user).catch(err => {
      console.error('Failed to send registration email:', err.message);
    });

    // If course has a price, initiate payment
    if (course.price > 0) {
      const paymentResult = await paymentService.initiateCoursePayment(registration, course, user);

      return res.status(201).json({
        success: true,
        message: isReactivated ? 'Registration reactivated' : 'Registration created',
        data: {
          registration,
          course: {
            _id: course._id,
            title: course.title,
            price: course.price
          },
          payment: paymentResult
        }
      });
    }

    // Free course - mark as active immediately
    const updatedRegistration = await courseRegistrationService.updateRegistrationStatus(
      registration._id,
      'ACTIVE'
    );

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: {
        registration: updatedRegistration,
        course: {
          _id: course._id,
          title: course.title,
          price: course.price
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new course (admin)
 */
const create = async (req, res, next) => {
  try {
    const course = await courseService.createCourse(req.body, req.user.userId);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a course (admin)
 */
const update = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a course (admin - soft delete)
 */
const remove = async (req, res, next) => {
  try {
    await courseService.deleteCourse(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all courses (admin - includes disabled)
 */
const getAllAdmin = async (req, res, next) => {
  try {
    const { page, limit, includeDeleted, isEnabled } = req.query;
    const result = await courseService.getAllCourses(
      { includeDeleted, isEnabled },
      { page, limit }
    );

    res.status(200).json({
      success: true,
      message: 'Courses retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get course registrations (admin)
 */
const getRegistrations = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await courseRegistrationService.getCourseRegistrations(
      req.params.id,
      { page, limit, status }
    );

    res.status(200).json({
      success: true,
      message: 'Registrations retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  register,
  create,
  update,
  remove,
  getAllAdmin,
  getRegistrations
};
