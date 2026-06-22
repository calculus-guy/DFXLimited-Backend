const reviewService = require('../services/reviewService');
const ApiError = require('../utils/ApiError');

const createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      throw new ApiError(400, 'productId, rating, and comment are required');
    }

    const review = await reviewService.createReview(
      productId,
      req.user._id,
      req.user.name,
      rating,
      comment
    );

    res.status(201).json({ success: true, data: { review } });
  } catch (error) {
    next(error);
  }
};

const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page, limit } = req.query;

    const result = await reviewService.getProductReviews(productId, { page, limit });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, getProductReviews };
