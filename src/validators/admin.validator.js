const Joi = require('joi');

const activityLogFilters = Joi.object({
  action: Joi.string().valid(
    'USER_REGISTERED',
    'USER_LOGIN',
    'ORDER_CREATED',
    'ORDER_PAID',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'PRODUCT_CREATED',
    'PRODUCT_UPDATED',
    'PRODUCT_DELETED',
    'COURSE_CREATED',
    'COURSE_UPDATED',
    'COURSE_DELETED',
    'COURSE_REGISTRATION',
    'COURSE_PAYMENT',
    'MATERIAL_UPLOADED',
    'MATERIAL_DELETED',
    'CONTACT_RECEIVED',
    'CONTACT_READ',
    'CONTACT_REPLIED',
    'PROJECT_CREATED',
    'PROJECT_UPDATED',
    'PROJECT_PUBLISHED',
    'PROJECT_DELETED'
  ),
  actorType: Joi.string().valid('USER', 'ADMIN', 'SYSTEM', 'GUEST'),
  targetType: Joi.string().valid('USER', 'ORDER', 'PAYMENT', 'PRODUCT', 'COURSE', 'REGISTRATION', 'MATERIAL', 'CONTACT', 'PROJECT'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const userListFilters = Joi.object({
  role: Joi.string().valid('USER', 'ADMIN'),
  isActive: Joi.boolean(),
  search: Joi.string().max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const userSearch = Joi.object({
  q: Joi.string().min(2).max(100).required(),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

const revenueFilters = Joi.object({
  period: Joi.string().valid('all', 'thisMonth', 'lastMonth', 'thisYear')
});

module.exports = {
  activityLogFilters,
  userListFilters,
  userSearch,
  revenueFilters
};
