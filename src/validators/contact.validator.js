const Joi = require('joi');

const submitContact = {
  body: Joi.object({
    name: Joi.string().required().max(100).trim().messages({
      'string.empty': 'Name is required',
      'string.max': 'Name cannot exceed 100 characters'
    }),
    email: Joi.string().required().email().trim().lowercase().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email'
    }),
    phone: Joi.string().max(20).allow(null, '').optional(),
    company: Joi.string().max(200).allow(null, '').optional(),
    serviceType: Joi.string()
      .valid('WEB_APP', 'MOBILE_APP', 'IT_INFRASTRUCTURE', 'CLOUD_COMPUTING', 'SERVER_DEPLOYMENT', 'IOT_INTEGRATION', 'NETWORK_SECURITY', 'NETWORK_SETUP')
      .allow(null)
      .optional(),
    message: Joi.string().required().max(5000).messages({
      'string.empty': 'Message is required',
      'string.max': 'Message cannot exceed 5000 characters'
    })
  })
};

const updateStatus = {
  params: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'Contact ID is required'
    })
  }),
  body: Joi.object({
    status: Joi.string().required().valid('NEW', 'READ', 'REPLIED').messages({
      'string.empty': 'Status is required',
      'any.only': 'Status must be NEW, READ, or REPLIED'
    })
  })
};

const getContactById = {
  params: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'Contact ID is required'
    })
  })
};

const listContacts = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    status: Joi.string().valid('NEW', 'READ', 'REPLIED').optional()
  })
};

module.exports = {
  submitContact,
  updateStatus,
  getContactById,
  listContacts
};
