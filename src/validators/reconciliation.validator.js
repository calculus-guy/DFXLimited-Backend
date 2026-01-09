const Joi = require('joi');

const reconciliationReasonSchema = Joi.object({
  reason: Joi.string().max(500).optional().messages({
    'string.max': 'Reason cannot exceed 500 characters'
  })
});

const registrationFilterSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string().valid('PENDING', 'PAID', 'ACTIVE', 'CANCELLED').optional(),
  courseId: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'Invalid course ID format',
    'string.length': 'Invalid course ID format'
  }),
  userId: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'Invalid user ID format',
    'string.length': 'Invalid user ID format'
  })
});

module.exports = {
  reconciliationReasonSchema,
  registrationFilterSchema
};