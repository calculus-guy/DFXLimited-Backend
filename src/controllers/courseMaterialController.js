const courseMaterialService = require('../services/courseMaterialService');
const courseRegistrationService = require('../services/courseRegistrationService');
const emailService = require('../services/emailService');
const courseService = require('../services/courseService');
const ApiError = require('../utils/ApiError');

/**
 * Upload course material (admin)
 */
const uploadMaterial = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const adminId = req.user.userId;

    if (!req.file) {
      throw new ApiError(400, 'No file provided');
    }

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      throw new ApiError(400, 'Only PDF files are allowed');
    }

    const metadata = {
      title: req.body.title,
      weekNumber: parseInt(req.body.weekNumber),
      label: req.body.label || null
    };

    const material = await courseMaterialService.uploadMaterial(
      courseId,
      req.file,
      metadata,
      adminId
    );

    // Send notification to enrolled students
    try {
      const course = await courseService.getCourseById(courseId);
      const enrolledStudents = await courseRegistrationService.getEnrolledStudents(courseId);
      
      if (enrolledStudents.length > 0) {
        emailService.sendNewMaterialNotification(material, course, enrolledStudents).catch(err => {
          console.error('Failed to send material notifications:', err.message);
        });
      }
    } catch (error) {
      console.error('Failed to notify students:', error.message);
    }

    res.status(201).json({
      success: true,
      message: 'Material uploaded successfully',
      data: { material }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all materials for a course (admin)
 */
const listMaterials = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const includeDeleted = req.query.includeDeleted === 'true';

    const materials = await courseMaterialService.getMaterialsByCourse(courseId, includeDeleted);

    res.status(200).json({
      success: true,
      message: 'Materials retrieved successfully',
      data: { materials }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update material metadata (admin)
 */
const updateMaterial = async (req, res, next) => {
  try {
    const { materialId } = req.params;

    const material = await courseMaterialService.updateMaterial(materialId, req.body);

    res.status(200).json({
      success: true,
      message: 'Material updated successfully',
      data: { material }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete material (admin - soft delete)
 */
const deleteMaterial = async (req, res, next) => {
  try {
    const { materialId } = req.params;
    const adminId = req.user.userId;

    await courseMaterialService.deleteMaterial(materialId, adminId);

    res.status(200).json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get materials for enrolled students
 */
const getStudentMaterials = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Enrollment is verified by middleware
    const materials = await courseMaterialService.getStudentMaterials(courseId);

    res.status(200).json({
      success: true,
      message: 'Materials retrieved successfully',
      data: { materials }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download material (enrolled students only)
 */
const downloadMaterial = async (req, res, next) => {
  try {
    const { courseId, materialId } = req.params;

    // Verify material belongs to course
    const material = await courseMaterialService.verifyMaterialBelongsToCourse(materialId, courseId);

    // Generate signed URL
    const signedUrl = courseMaterialService.generateSignedUrl(material);

    res.status(200).json({
      success: true,
      message: 'Download URL generated',
      data: {
        material: {
          _id: material._id,
          title: material.title,
          weekNumber: material.weekNumber,
          label: material.label
        },
        download: signedUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadMaterial,
  listMaterials,
  updateMaterial,
  deleteMaterial,
  getStudentMaterials,
  downloadMaterial
};
