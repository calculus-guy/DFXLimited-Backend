const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public: get reviews for a product
router.get('/product/:productId', reviewController.getProductReviews);

// Protected: submit a review (must be logged in)
router.post('/', authenticate, reviewController.createReview);

module.exports = router;
