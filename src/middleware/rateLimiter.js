const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  message: {
    success: false,
    error: {
      statusCode: 429,
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const contactFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per hour per IP
  message: {
    success: false,
    error: {
      statusCode: 429,
      message: 'Too many contact submissions, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, contactFormLimiter };
