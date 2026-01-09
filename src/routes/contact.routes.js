const express = require('express');
const contactController = require('../controllers/contactController');
const validate = require('../middleware/validate');
const contactValidator = require('../validators/contact.validator');
const { contactFormLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/',
  contactFormLimiter,
  validate(contactValidator.submitContact),
  contactController.submit
);

module.exports = router;
