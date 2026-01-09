const express = require('express');
const courseController = require('../../controllers/courseController');
const courseMaterialController = require('../../controllers/courseMaterialController');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');
const validate = require('../../middleware/validate');
const courseValidator = require('../../validators/course.validator');
const { uploadCourseMaterial } = require('../../config/cloudinary');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole('admin'));

// Course CRUD
router.get('/', validate(courseValidator.listCourses), courseController.getAllAdmin);
router.post('/', validate(courseValidator.createCourse), courseController.create);
router.put('/:id', validate(courseValidator.updateCourse), courseController.update);
router.delete('/:id', validate(courseValidator.getCourseById), courseController.remove);

// Course registrations
router.get('/:id/registrations', courseController.getRegistrations);

// Course materials
router.get('/:id/materials', courseMaterialController.listMaterials);

router.post(
  '/:id/materials',
  uploadCourseMaterial.single('file'),
  validate(courseValidator.uploadMaterial),
  courseMaterialController.uploadMaterial
);

router.put(
  '/:id/materials/:materialId',
  validate(courseValidator.updateMaterial),
  courseMaterialController.updateMaterial
);

router.delete(
  '/:id/materials/:materialId',
  courseMaterialController.deleteMaterial
);

module.exports = router;
