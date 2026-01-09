const Course = require('../models/Course');
const ApiError = require('../utils/ApiError');

/**
 * Create a new course
 */
const createCourse = async (courseData, adminId) => {
  const course = await Course.create({
    ...courseData,
    createdBy: adminId
  });
  return course;
};

/**
 * Get course by ID
 */
const getCourseById = async (id, includeDeleted = false) => {
  const query = { _id: id };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  
  const course = await Course.findOne(query);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  return course;
};

/**
 * Get all available courses (public - enabled and non-deleted)
 */
const getAvailableCourses = async (pagination = {}) => {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const query = { isEnabled: true, isDeleted: false };

  const [courses, total] = await Promise.all([
    Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Course.countDocuments(query)
  ]);

  return {
    courses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get all courses (admin - includes disabled, optionally deleted)
 */
const getAllCourses = async (filters = {}, pagination = {}) => {
  const { includeDeleted = false, isEnabled } = filters;
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const query = {};
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  if (typeof isEnabled === 'boolean') {
    query.isEnabled = isEnabled;
  }

  const [courses, total] = await Promise.all([
    Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email'),
    Course.countDocuments(query)
  ]);

  return {
    courses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update course
 */
const updateCourse = async (id, updateData) => {
  const course = await Course.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updateData,
    { new: true, runValidators: true }
  );

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  return course;
};

/**
 * Soft delete course
 */
const deleteCourse = async (id) => {
  const course = await Course.findOne({ _id: id, isDeleted: false });
  
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  await course.softDelete();
  return course;
};

/**
 * Check if course is available for registration
 */
const isCourseAvailable = async (id) => {
  const course = await Course.findOne({
    _id: id,
    isEnabled: true,
    isDeleted: false
  });
  return !!course;
};

module.exports = {
  createCourse,
  getCourseById,
  getAvailableCourses,
  getAllCourses,
  updateCourse,
  deleteCourse,
  isCourseAvailable
};
