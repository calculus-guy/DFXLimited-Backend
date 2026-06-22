const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');

const createReview = async (productId, userId, userName, rating, comment) => {
  const existing = await Review.findOne({ productId, userId });
  if (existing) {
    throw new ApiError(409, 'You have already reviewed this product');
  }

  const review = await Review.create({ productId, userId, userName, rating, comment });
  return review;
};

const getProductReviews = async (productId, pagination = {}) => {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Review.countDocuments({ productId }),
  ]);

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return {
    reviews,
    averageRating: Math.round(avgRating * 10) / 10,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getUserReview = async (productId, userId) => {
  return Review.findOne({ productId, userId });
};

module.exports = { createReview, getProductReviews, getUserReview };
