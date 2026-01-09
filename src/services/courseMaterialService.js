const CourseMaterial = require('../models/CourseMaterial');
const Course = require('../models/Course');
const { cloudinary } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

/**
 * Upload course material
 */
const uploadMaterial = async (courseId, file, metadata, adminId) => {
  // Verify course exists
  const course = await Course.findOne({ _id: courseId, isDeleted: false });
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  if (!file) {
    throw new ApiError(400, 'No file provided');
  }

  // Create material record
  const material = await CourseMaterial.create({
    courseId,
    title: metadata.title,
    weekNumber: metadata.weekNumber,
    label: metadata.label || null,
    cloudinaryPublicId: file.filename,
    secureUrl: file.path,
    fileSize: file.size,
    originalFilename: file.originalname,
    uploadedBy: adminId
  });

  return material;
};

/**
 * Get material by ID
 */
const getMaterialById = async (id, includeDeleted = false) => {
  const query = { _id: id };
  if (!includeDeleted) {
    query.isDeleted = false;
  }

  const material = await CourseMaterial.findOne(query)
    .populate('uploadedBy', 'name email');

  if (!material) {
    throw new ApiError(404, 'Material not found');
  }

  return material;
};

/**
 * Get all materials for a course
 */
const getMaterialsByCourse = async (courseId, includeDeleted = false) => {
  const query = { courseId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }

  const materials = await CourseMaterial.find(query)
    .sort({ weekNumber: 1, createdAt: 1 })
    .populate('uploadedBy', 'name email');

  return materials;
};

/**
 * Get materials for enrolled students (excludes sensitive data)
 */
const getStudentMaterials = async (courseId) => {
  const materials = await CourseMaterial.find({
    courseId,
    isDeleted: false
  })
    .select('title weekNumber label fileSize createdAt')
    .sort({ weekNumber: 1, createdAt: 1 });

  return materials;
};

/**
 * Update material metadata
 */
const updateMaterial = async (id, updateData) => {
  // Only allow updating specific fields
  const allowedUpdates = ['title', 'weekNumber', 'label'];
  const filteredData = {};
  
  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      filteredData[key] = updateData[key];
    }
  }

  const material = await CourseMaterial.findOneAndUpdate(
    { _id: id, isDeleted: false },
    filteredData,
    { new: true, runValidators: true }
  );

  if (!material) {
    throw new ApiError(404, 'Material not found');
  }

  return material;
};

/**
 * Soft delete material
 */
const deleteMaterial = async (id) => {
  const material = await CourseMaterial.findOne({ _id: id, isDeleted: false });

  if (!material) {
    throw new ApiError(404, 'Material not found');
  }

  await material.softDelete();
  return material;
};

/**
 * Generate signed URL for secure download
 * TTL: 10 minutes
 */
const generateSignedUrl = (material) => {
  const timestamp = Math.round(Date.now() / 1000);
  const expiresAt = timestamp + (10 * 60); // 10 minutes

  // Generate signed URL for raw resource (PDF)
  const signedUrl = cloudinary.utils.private_download_url(
    material.cloudinaryPublicId,
    'pdf',
    {
      resource_type: 'raw',
      expires_at: expiresAt,
      attachment: true
    }
  );

  return {
    url: signedUrl,
    expiresAt: new Date(expiresAt * 1000).toISOString()
  };
};

/**
 * Verify material belongs to course
 */
const verifyMaterialBelongsToCourse = async (materialId, courseId) => {
  const material = await CourseMaterial.findOne({
    _id: materialId,
    courseId,
    isDeleted: false
  });

  if (!material) {
    throw new ApiError(400, 'Material does not belong to this course');
  }

  return material;
};

/**
 * Hard delete material (removes from Cloudinary too)
 * Use with caution - typically soft delete is preferred
 */
const hardDeleteMaterial = async (id) => {
  const material = await CourseMaterial.findById(id);

  if (!material) {
    throw new ApiError(404, 'Material not found');
  }

  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(material.cloudinaryPublicId, {
      resource_type: 'raw'
    });
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error.message);
  }

  // Delete from database
  await CourseMaterial.findByIdAndDelete(id);

  return material;
};

module.exports = {
  uploadMaterial,
  getMaterialById,
  getMaterialsByCourse,
  getStudentMaterials,
  updateMaterial,
  deleteMaterial,
  generateSignedUrl,
  verifyMaterialBelongsToCourse,
  hardDeleteMaterial
};
