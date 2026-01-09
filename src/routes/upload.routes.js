const express = require('express');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const { uploadProductImage, uploadCourseMaterial } = require('../config/cloudinary');

const router = express.Router();

// All upload routes require admin authentication
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

// Product image uploads
router.post(
  '/product-image',
  uploadProductImage.single('image'),
  uploadController.uploadProductImage
);

router.post(
  '/product-images',
  uploadProductImage.array('images', 10), // Max 10 images
  uploadController.uploadProductImages
);

// Course material upload (PDF)
router.post(
  '/course-material',
  uploadCourseMaterial.single('file'),
  uploadController.uploadCourseMaterial
);

// Delete image
router.delete('/image/:publicId', uploadController.deleteImage);

module.exports = router;