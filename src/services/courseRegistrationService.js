const CourseRegistration = require('../models/CourseRegistration');
const Course = require('../models/Course');
const ApiError = require('../utils/ApiError');

/**
 * Register user for a course
 */
const registerForCourse = async (userId, courseId) => {
  // Check if course exists and is available
  const course = await Course.findOne({
    _id: courseId,
    isEnabled: true,
    isDeleted: false
  });

  if (!course) {
    throw new ApiError(400, 'Course is not available for registration');
  }

  // Check for existing registration
  const existingRegistration = await CourseRegistration.findOne({
    userId,
    courseId
  });

  if (existingRegistration) {
    if (existingRegistration.status === 'CANCELLED') {
      // Reactivate cancelled registration
      existingRegistration.status = 'PENDING';
      existingRegistration.registeredAt = new Date();
      await existingRegistration.save();
      return { registration: existingRegistration, course, isReactivated: true };
    }
    throw new ApiError(409, 'You are already registered for this course');
  }

  // Create new registration
  const registration = await CourseRegistration.create({
    userId,
    courseId,
    status: 'PENDING'
  });

  return { registration, course, isReactivated: false };
};

/**
 * Get registration by ID
 */
const getRegistrationById = async (id) => {
  const registration = await CourseRegistration.findById(id)
    .populate('courseId')
    .populate('userId', 'name email');

  if (!registration) {
    throw new ApiError(404, 'Registration not found');
  }

  return registration;
};

/**
 * Get registration by user and course
 */
const getRegistrationByUserAndCourse = async (userId, courseId) => {
  const registration = await CourseRegistration.findOne({ userId, courseId })
    .populate('courseId');
  return registration;
};

/**
 * Get all registrations for a user
 */
const getUserRegistrations = async (userId, pagination = {}) => {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const [registrations, total] = await Promise.all([
    CourseRegistration.find({ userId })
      .populate('courseId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    CourseRegistration.countDocuments({ userId })
  ]);

  return {
    registrations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update registration status
 */
const updateRegistrationStatus = async (id, status, paymentRef = null) => {
  const updateData = { status };
  
  if (status === 'PAID' || status === 'ACTIVE') {
    updateData.paidAt = new Date();
  }
  
  if (paymentRef) {
    updateData.paymentRef = paymentRef;
  }

  const registration = await CourseRegistration.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  ).populate('courseId').populate('userId', 'name email');

  if (!registration) {
    throw new ApiError(404, 'Registration not found');
  }

  return registration;
};

/**
 * Check if user is enrolled in a course (PAID or ACTIVE status)
 */
const isUserEnrolled = async (userId, courseId) => {
  return CourseRegistration.isUserEnrolled(userId, courseId);
};

/**
 * Get all enrolled students for a course
 */
const getEnrolledStudents = async (courseId) => {
  return CourseRegistration.getEnrolledStudents(courseId);
};

/**
 * Get registrations for a course (admin)
 */
const getCourseRegistrations = async (courseId, pagination = {}) => {
  const { page = 1, limit = 10, status } = pagination;
  const skip = (page - 1) * limit;

  const query = { courseId };
  if (status) {
    query.status = status;
  }

  const [registrations, total] = await Promise.all([
    CourseRegistration.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    CourseRegistration.countDocuments(query)
  ]);

  return {
    registrations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  registerForCourse,
  getRegistrationById,
  getRegistrationByUserAndCourse,
  getUserRegistrations,
  updateRegistrationStatus,
  isUserEnrolled,
  getEnrolledStudents,
  getCourseRegistrations
};
