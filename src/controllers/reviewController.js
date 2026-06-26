const reviewService = require('../services/reviewService');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      throw new ApiError(400, 'productId, rating, and comment are required');
    }

    // req.user comes from JWT payload: { userId, email, role }
    const userId = req.user.userId;
    if (!userId) {
      throw new ApiError(401, 'User identity could not be determined');
    }

    // Fetch name from DB since it is not stored in the JWT
    const user = await User.findById(userId).select('name');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const review = await reviewService.createReview(
      productId,
      userId,
      user.name,
      Number(rating),
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
