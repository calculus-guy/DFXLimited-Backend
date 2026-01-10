const ApiError = require('../utils/ApiError');

const validate = (schema, source = 'body') => (req, res, next) => {
  // Handle schema objects with body/query/params properties
  // e.g., { body: Joi.object(...), params: Joi.object(...) }
  if (schema && typeof schema === 'object' && !schema.validate) {
    const errors = [];
    
    // Validate params if schema has params
    if (schema.params && req.params) {
      const { error, value } = schema.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map((detail) => ({
          field: `params.${detail.path.join('.')}`,
          message: detail.message.replace(/"/g, ''),
        })));
      } else {
        req.params = value;
      }
    }
    
    // Validate query if schema has query
    if (schema.query && req.query) {
      const { error, value } = schema.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map((detail) => ({
          field: `query.${detail.path.join('.')}`,
          message: detail.message.replace(/"/g, ''),
        })));
      } else {
        req.query = value;
      }
    }
    
    // Validate body if schema has body
    if (schema.body && req.body) {
      const { error, value } = schema.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/"/g, ''),
        })));
      } else {
        req.body = value;
      }
    }
    
    if (errors.length > 0) {
      const apiError = new ApiError(400, 'Validation failed');
      apiError.errors = errors;
      return next(apiError);
    }
    
    return next();
  }
  
  // Handle direct Joi schema (backward compatibility)
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