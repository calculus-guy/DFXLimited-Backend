const express = require('express');
const courseController = require('../controllers/courseController');
const courseMaterialController = require('../controllers/courseMaterialController');
const courseRegistrationController = require('../controllers/courseRegistrationController');
const { authenticate } = require('../middleware/auth');
const { verifyEnrollment } = require('../middleware/enrollment');
const validate = require('../middleware/validate');
const courseValidator = require('../validators/course.validator');

const router = express.Router();

// Public routes
router.get('/', validate(courseValidator.listCourses), courseController.getAll);
router.get('/:id', validate(courseValidator.getCourseById), courseController.getById);

// Auth required routes
router.post(
  '/:id/register',
  authenticate,
  validate(courseValidator.registerForCourse),
  courseController.register
);

// Material routes (auth + enrollment required)
router.get(
  '/:courseId/materials',
  authenticate,
  verifyEnrollment,
  courseMaterialController.getStudentMaterials
);

router.get(
  '/:courseId/materials/:materialId/download',
  authenticate,
  verifyEnrollment,
  validate(courseValidator.getMaterial),
  courseMaterialController.downloadMaterial
);

module.exports = router;
