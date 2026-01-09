const Joi = require('joi');

const createProject = {
  body: Joi.object({
    title: Joi.string().required().max(200).trim().messages({
      'string.empty': 'Project title is required',
      'string.max': 'Title cannot exceed 200 characters'
    }),
    category: Joi.string()
      .required()
      .valid('FINTECH', 'HEALTH', 'TRAVEL', 'ERP', 'ECOMMERCE', 'EDUCATION', 'OTHER')
      .messages({
        'string.empty': 'Category is required',
        'any.only': 'Invalid category'
      }),
    shortDescription: Joi.string().required().max(500).messages({
      'string.empty': 'Short description is required',
      'string.max': 'Short description cannot exceed 500 characters'
    }),
    fullDescription: Joi.string().max(5000).allow(null, '').optional(),
    coverImageUrl: Joi.string().required().uri().messages({
      'string.empty': 'Cover image URL is required',
      'string.uri': 'Please provide a valid URL'
    }),
    caseStudyUrl: Joi.string().uri().allow(null, '').optional(),
    isPublished: Joi.boolean().default(false)
  })
};

const updateProject = {
  params: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'Project ID is required'
    })
  }),
  body: Joi.object({
    title: Joi.string().max(200).trim().optional(),
    category: Joi.string()
      .valid('FINTECH', 'HEALTH', 'TRAVEL', 'ERP', 'ECOMMERCE', 'EDUCATION', 'OTHER')
      .optional(),
    shortDescription: Joi.string().max(500).optional(),
    fullDescription: Joi.string().max(5000).allow(null, '').optional(),
    coverImageUrl: Joi.string().uri().optional(),
    caseStudyUrl: Joi.string().uri().allow(null, '').optional(),
    isPublished: Joi.boolean().optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

const getProjectById = {
  params: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'Project ID is required'
    })
  })
};

const listProjects = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    category: Joi.string()
      .valid('FINTECH', 'HEALTH', 'TRAVEL', 'ERP', 'ECOMMERCE', 'EDUCATION', 'OTHER')
      .optional(),
    isPublished: Joi.boolean().optional()
  })
};

module.exports = {
  createProject,
  updateProject,
  getProjectById,
  listProjects
};
