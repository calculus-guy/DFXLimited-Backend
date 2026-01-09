const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
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
    ]
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  actorType: {
    type: String,
    enum: ['USER', 'ADMIN', 'SYSTEM', 'GUEST'],
    default: 'SYSTEM'
  },
  targetType: {
    type: String,
    enum: ['USER', 'ORDER', 'PAYMENT', 'PRODUCT', 'COURSE', 'REGISTRATION', 'MATERIAL', 'CONTACT', 'PROJECT'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ actorType: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
