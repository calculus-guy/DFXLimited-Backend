const mongoose = require('mongoose');
const crypto = require('crypto');

const paymentSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    courseRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseRegistration',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
    },
    type: {
      type: String,
      enum: ['PRODUCT', 'COURSE'],
      default: 'PRODUCT',
    },
    provider: {
      type: String,
      default: 'PAYSTACK',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    paystackReference: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique reference before saving
paymentSchema.pre('save', function (next) {
  if (!this.reference) {
    const timestamp = Date.now().toString(36);
    const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.reference = `DFX_PAY_${timestamp}_${randomStr}`;
  }
  next();
});

// Index for faster queries
paymentSchema.index({ reference: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ courseRegistrationId: 1 });
paymentSchema.index({ paystackReference: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
