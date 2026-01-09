const express = require('express');
const contactController = require('../../controllers/contactController');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');
const validate = require('../../middleware/validate');
const contactValidator = require('../../validators/contact.validator');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireRole('admin'));

// Get contact statistics
router.get('/stats', contactController.getStats);

// List all contacts
router.get('/', validate(contactValidator.listContacts), contactController.getAll);

// Get contact by ID
router.get('/:id', validate(contactValidator.getContactById), contactController.getById);

// Update contact status
router.put('/:id/status', validate(contactValidator.updateStatus), contactController.updateStatus);

module.exports = router;
