const express = require('express');
const courseRegistrationController = require('../controllers/courseRegistrationController');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile
router.patch('/me', authController.updateMe);

// Course registrations
router.get('/me/registrations', courseRegistrationController.getUserRegistrations);
router.get('/me/registrations/:id', courseRegistrationController.getRegistrationById);

module.exports = router;
