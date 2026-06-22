const express = require('express');
const promoController = require('../controllers/promoController');

const router = express.Router();

// Validate a promo code (public — called at checkout before payment)
router.post('/validate', promoController.validatePromo);

module.exports = router;
