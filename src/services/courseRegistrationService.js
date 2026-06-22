const CourseRegistration = require('../models/CourseRegistration');
const Course = require('../models/Course');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('./activityLogService');

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
    if (['PAID', 'ACTIVE'].includes(existingRegistration.status)) {
      throw new ApiError(409, 'You are already enrolled in this course');
    }

    if (existingRegistration.status === 'CANCELLED') {
      // Reactivate cancelled registration with updated pricing
      const taxRate = 7.5;
      const taxAmount = Math.round((course.price * taxRate) / 100);
      const totalAmount = course.price + taxAmount;

      existingRegistration.status = 'PENDING';
      existingRegistration.registeredAt = new Date();
      existingRegistration.coursePrice = course.price;
      existingRegistration.taxAmount = taxAmount;
      existingRegistration.taxRate = taxRate;
      existingRegistration.totalAmount = totalAmount;
      await existingRegistration.save();
      return { registration: existingRegistration, course, isReactivated: true, isPaymentRetry: false };
    }

    // PENDING status — return existing registration so payment can be retried
    return { registration: existingRegistration, course, isReactivated: false, isPaymentRetry: true };
  }

  // Calculate tax (7.5% VAT)
  const taxRate = 7.5;
  const taxAmount = Math.round((course.price * taxRate) / 100);
  const totalAmount = course.price + taxAmount;

  // Create new registration
  const registration = await CourseRegistration.create({
    userId,
    courseId,
    coursePrice: course.price,
    taxAmount,
    taxRate,
    totalAmount,
    status: 'PENDING'
  });

  // Log activity
  logActivity({
    action: 'COURSE_REGISTRATION',
    actor: userId,
    actorType: 'USER',
    targetType: 'REGISTRATION',
    targetId: registration._id,
    metadata: { courseId, courseName: course.title, coursePrice: course.price, taxAmount, totalAmount }
  });

  return { registration, course, isReactivated: false, isPaymentRetry: false };
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

/**
 * Admin: Grant course access (manual enrollment)
 * Used for complimentary access, offline payments, etc.
 */
const adminGrantAccess = async (registrationId, adminId, reason = null) => {
  const registration = await CourseRegistration.findById(registrationId)
    .populate('courseId')
    .populate('userId', 'name email');

  if (!registration) {
    throw new ApiError(404, 'Registration not found');
  }

  if (['PAID', 'ACTIVE'].includes(registration.status)) {
    throw new ApiError(400, 'User already has access to this course');
  }

  // Generate manual payment reference
  const manualRef = `MANUAL_GRANT_${Date.now()}_${registrationId.toString().slice(-6)}`;

  registration.status = 'ACTIVE';
  registration.paymentRef = manualRef;
  registration.paidAt = new Date();
  await registration.save();

  // Log activity
  logActivity({
    action: 'COURSE_ACCESS_GRANTED',
    actor: adminId,
    actorType: 'ADMIN',
    targetType: 'REGISTRATION',
    targetId: registration._id,
    metadata: { 
      courseId: registration.courseId._id,
      courseName: registration.courseId.title,
      userId: registration.userId._id,
      userName: registration.userId.name,
      reason: reason || 'Manual access grant'
    }
  });

  return registration;
};

/**
 * Admin: Revoke course access
 */
const adminRevokeAccess = async (registrationId, adminId, reason = null) => {
  const registration = await CourseRegistration.findById(registrationId)
    .populate('courseId')
    .populate('userId', 'name email');

  if (!registration) {
    throw new ApiError(404, 'Registration not found');
  }

  if (!['PAID', 'ACTIVE'].includes(registration.status)) {
    throw new ApiError(400, 'User does not have active access to revoke');
  }

  registration.status = 'CANCELLED';
  await registration.save();

  // Log activity
  logActivity({
    action: 'COURSE_ACCESS_REVOKED',
    actor: adminId,
    actorType: 'ADMIN',
    targetType: 'REGISTRATION',
    targetId: registration._id,
    metadata: { 
      courseId: registration.courseId._id,
      courseName: registration.courseId.title,
      userId: registration.userId._id,
      userName: registration.userId.name,
      reason: reason || 'Manual access revocation'
    }
  });

  return registration;
};

/**
 * Admin: Get all registrations with filters
 */
const getAllRegistrations = async (filters = {}, pagination = {}) => {
  const { status, courseId, userId } = filters;
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const query = {};
  if (status) query.status = status;
  if (courseId) query.courseId = courseId;
  if (userId) query.userId = userId;

  const [registrations, total] = await Promise.all([
    CourseRegistration.find(query)
      .populate('courseId', 'title price')
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
  getCourseRegistrations,
  adminGrantAccess,
  adminRevokeAccess,
  getAllRegistrations
};
