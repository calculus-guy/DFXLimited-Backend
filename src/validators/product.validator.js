const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().required().trim().messages({
    'any.required': 'Product name is required',
  }),
  description: Joi.string().trim().allow(''),
  price: Joi.number().required().min(0).messages({
    'any.required': 'Product price is required',
    'number.min': 'Price cannot be negative',
  }),
  images: Joi.array().items(Joi.string().uri()).default([]),
  category: Joi.string().trim().allow(''),
  stockQuantity: Joi.number().min(0).default(0).messages({
    'number.min': 'Stock quantity cannot be negative',
  }),
  isActive: Joi.boolean().default(true),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string().trim().allow(''),
  price: Joi.number().min(0).messages({
    'number.min': 'Price cannot be negative',
  }),
  images: Joi.array().items(Joi.string().uri()),
  category: Joi.string().trim().allow(''),
  stockQuantity: Joi.number().min(0).messages({
    'number.min': 'Stock quantity cannot be negative',
  }),
  stockStatus: Joi.string().valid('IN_STOCK', 'OUT_OF_STOCK'),
  isActive: Joi.boolean(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

module.exports = {
  createProductSchema,
  updateProductSchema,
};