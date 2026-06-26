const express = require('express');
const { getForm, submitForm } = require('../controllers/formController');

const router = express.Router();

// No authentication required — forms are accessed via direct unlisted link
router.get('/:slug', getForm);
router.post('/:slug/submit', submitForm);

module.exports = router;
