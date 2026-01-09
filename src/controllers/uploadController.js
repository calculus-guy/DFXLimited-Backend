const uploadService = require('../services/uploadService');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

/**
 * Upload single product image
 * POST /api/upload/product-image
 */
const uploadProductImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No image file provided');
  }

  const result = await uploadService.uploadImage(req.file);

  res.status(200).json({
    success: true,
    data: {
      url: result.url,
      publicId: result.publicId,
    },
  });
});

/**
 * Upload multiple product images
 * POST /api/upload/product-images
 */
const uploadProductImages = catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No image files provided');
  }

  const results = await uploadService.uploadMultipleImages(req.files);

  res.status(200).json({
    success: true,
    data: {
      images: results,
    },
  });
});

/**
 * Upload course material (PDF)
 * POST /api/upload/course-material
 */
const uploadCourseMaterial = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No PDF file provided');
  }

  const result = await uploadService.uploadPDF(req.file);

  res.status(200).json({
    success: true,
    data: {
      url: result.url,
      publicId: result.publicId,
    },
  });
});

/**
 * Delete an image
 * DELETE /api/upload/image/:publicId
 */
const deleteImage = catchAsync(async (req, res) => {
  const { publicId } = req.params;

  await uploadService.deleteImage(publicId);

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully',
  });
});

module.exports = {
  uploadProductImage,
  uploadProductImages,
  uploadCourseMaterial,
  deleteImage,
};
