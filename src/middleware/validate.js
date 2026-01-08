const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/"/g, ''),
    }));

    const apiError = new ApiError(400, 'Validation failed');
    apiError.errors = errors;
    return next(apiError);
  }

  // Replace body with sanitized value
  req.body = value;
  next();
};

module.exports = validate;
