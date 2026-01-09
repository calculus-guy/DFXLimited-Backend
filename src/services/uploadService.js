const { cloudinary } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

/**
 * Upload a single image to Cloudinary
 * @param {Object} file - Multer file object
 * @param {String} folder - Cloudinary folder
 * @returns {Object} - { url, publicId }
 */
const uploadImage = async (file, folder = 'dfx/products') => {
  if (!file) {
    throw new ApiError(400, 'No file provided');
  }

  // File is already uploaded by multer-storage-cloudinary
  return {
    url: file.path,
    publicId: file.filename,
  };
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array} files - Array of Multer file objects
 * @param {String} folder - Cloudinary folder
 * @returns {Array} - Array of { url, publicId }
 */
const uploadMultipleImages = async (files, folder = 'dfx/products') => {
  if (!files || files.length === 0) {
    return [];
  }

  return files.map((file) => ({
    url: file.path,
    publicId: file.filename,
  }));
};

/**
 * Delete an image from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 */
const deleteImage = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete image from Cloudinary:', error.message);
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array} publicIds - Array of Cloudinary public IDs
 */
const deleteMultipleImages = async (publicIds) => {
  if (!publicIds || publicIds.length === 0) return;

  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error('Failed to delete images from Cloudinary:', error.message);
  }
};

/**
 * Upload a PDF to Cloudinary
 * @param {Object} file - Multer file object
 * @returns {Object} - { url, publicId }
 */
const uploadPDF = async (file) => {
  if (!file) {
    throw new ApiError(400, 'No file provided');
  }

  return {
    url: file.path,
    publicId: file.filename,
  };
};

/**
 * Delete a PDF from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 */
const deletePDF = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch (error) {
    console.error('Failed to delete PDF from Cloudinary:', error.message);
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  uploadPDF,
  deletePDF,
};
