const { config } = require('../config');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If not an ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false);
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ApiError(409, `${field} already exists`);
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = new ApiError(400, 'Validation failed');
    error.errors = errors;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired');
  }

  const response = {
    success: false,
    error: {
      statusCode: error.statusCode,
      message: error.message,
    },
  };

  // Add validation errors if present
  if (error.errors) {
    response.error.errors = error.errors;
  }

  // Add stack trace in development
  if (config.env === 'development') {
    response.error.stack = err.stack;
  }

  // Log error
  console.error(`[ERROR] ${error.statusCode} - ${error.message}`);
  if (config.env === 'development') {
    console.error(err.stack);
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
