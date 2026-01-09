const ApiError = require('../utils/ApiError');

const validate = (schema, source = 'body') => (req, res, next) => {
  const dataToValidate = source === 'query' ? req.query : req.body;
  
  const { error, value } = schema.validate(dataToValidate, {
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

  // Replace with sanitized value
  if (source === 'query') {
    req.query = value;
  } else {
    req.body = value;
  }
  
  next();
};

module.exports = validate;