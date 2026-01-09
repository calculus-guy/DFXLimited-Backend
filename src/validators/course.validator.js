const Joi = require('joi');

const createCourse = {
  body: Joi.object({
    title: Joi.string().required().max(200).trim().messages({
      'string.empty': 'Course title is required',
      'string.max': 'Title cannot exceed 200 characters'
    }),
    description: Joi.string().required().max(5000).messages({
      'string.empty': 'Course description is required',
      'string.max': 'Description cannot exceed 5000 characters'
    }),
    price: Joi.number().required().min(0).messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative'
    }),
    duration: Joi.string().max(100).allow(null, '').optional(),
    thumbnail: Joi.string().uri().allow(null, '').optional(),
    isEnabled: Joi.boolean().default(true)
  })
};

const updateCourse = {
  params: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'Course ID is required'
    })
  }),
  body: Joi.object({
    title: Joi.string().max(200).trim().optional(),
    description: Joi.string().max(5000).optional(),
    price: Joi.number().min(0).optional(),
    duration: Joi.string().max(100).allow(null, '').optional(),
    thumbnail: Joi.string().uri().allow(null, '').optional(),
    isEnabled: Joi.boolean().optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

const getCourseById = {
  params: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'Course ID is required'
    })
  })
};

const registerForCourse = {
  params: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'Course ID is required'
    })
  })
};

const uploadMaterial = {
  params: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'Course ID is required'
    })
  }),
  body: Joi.object({
    title: Joi.string().required().max(200).trim().messages({
      'string.empty': 'Material title is required',
      'string.max': 'Title cannot exceed 200 characters'
    }),
    weekNumber: Joi.number().required().min(1).messages({
      'number.base': 'Week number must be a number',
      'number.min': 'Week number must be at least 1'
    }),
    label: Joi.string().max(100).allow(null, '').optional()
  })
};

const updateMaterial = {
  params: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'Course ID is required'
    }),
    materialId: Joi.string().required().messages({
      'string.empty': 'Material ID is required'
    })
  }),
  body: Joi.object({
    title: Joi.string().max(200).trim().optional(),
    weekNumber: Joi.number().min(1).optional(),
    label: Joi.string().max(100).allow(null, '').optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

const getMaterial = {
  params: Joi.object({
    courseId: Joi.string().required().messages({
      'string.empty': 'Course ID is required'
    }),
    materialId: Joi.string().required().messages({
      'string.empty': 'Material ID is required'
    })
  })
};

const listCourses = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    includeDeleted: Joi.boolean().default(false),
    isEnabled: Joi.boolean().optional()
  })
};

module.exports = {
  createCourse,
  updateCourse,
  getCourseById,
  registerForCourse,
  uploadMaterial,
  updateMaterial,
  getMaterial,
  listCourses
};
