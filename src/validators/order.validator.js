const Joi = require('joi');

const checkoutSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required().messages({
          'any.required': 'Product ID is required',
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          'number.min': 'Quantity must be at least 1',
          'any.required': 'Quantity is required',
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'any.required': 'Items are required',
    }),
  checkoutData: Joi.object({
    name: Joi.string().required().trim().messages({
      'any.required': 'Customer name is required',
    }),
    email: Joi.string().email().required().lowercase().trim().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Customer email is required',
    }),
    phone: Joi.string().required().trim().messages({
      'any.required': 'Customer phone is required',
    }),
    address: Joi.string().required().trim().messages({
      'any.required': 'Delivery address is required',
    }),
  }).required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED')
    .required()
    .messages({
      'any.only': 'Invalid order status',
      'any.required': 'Status is required',
    }),
});

const lookupOrderSchema = Joi.object({
  orderNumber: Joi.string().required().messages({
    'any.required': 'Order number is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required',
  }),
});

module.exports = {
  checkoutSchema,
  updateStatusSchema,
  lookupOrderSchema,
};
