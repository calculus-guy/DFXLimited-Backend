const express = require('express');
const projectController = require('../controllers/projectController');
const validate = require('../middleware/validate');
const projectValidator = require('../validators/project.validator');

const router = express.Router();

// Public routes
router.get('/', validate(projectValidator.listProjects), projectController.getAll);
router.get('/categories', projectController.getCategoryStats);
router.get('/:id', validate(projectValidator.getProjectById), projectController.getById);

module.exports = router;
