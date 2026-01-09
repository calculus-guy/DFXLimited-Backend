const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const config = require('./env');

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const productImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dfx/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

const courseMaterialStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dfx/courses',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
  },
});

const uploadProductImage = multer({
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const uploadCourseMaterial = multer({
  storage: courseMaterialStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for PDFs
});

module.exports = {
  cloudinary,
  uploadProductImage,
  uploadCourseMaterial,
};
