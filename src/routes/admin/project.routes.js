const express = require('express');
const projectController = require('../../controllers/projectController');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');
const validate = require('../../middleware/validate');
const projectValidator = require('../../validators/project.validator');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole('admin'));

// List all projects (includes unpublished)
router.get('/', validate(projectValidator.listProjects), projectController.getAllAdmin);

// Create project
router.post('/', validate(projectValidator.createProject), projectController.create);

// Update project
router.put('/:id', validate(projectValidator.updateProject), projectController.update);

// Delete project
router.delete('/:id', validate(projectValidator.getProjectById), projectController.remove);

// Toggle publish status
router.patch('/:id/publish', validate(projectValidator.getProjectById), projectController.togglePublish);

module.exports = router;
