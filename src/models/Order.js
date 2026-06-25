const mongoose = require('mongoose');
const crypto = require('crypto');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const checkoutDataSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    items: [orderItemSchema],
    subtotalAmount: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    taxRate: {
      type: Number,
      required: true,
      default: 7.5, // 7.5% VAT
    },
    shippingMethod: {
      type: String,
      enum: ['STANDARD', 'EXPRESS', 'FREE'],
      default: 'STANDARD',
    },
    shippingAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    promoCode: {
      type: String,
      default: null,
    },
    promoDiscountAmount: {
      type: Number,
      default: 0, // in kobo
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    checkoutData: checkoutDataSchema,
    paymentRef: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique order number before saving
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.orderNumber = `DFX-${dateStr}-${randomStr}`;
  }
  next();
});

// Index for faster queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'checkoutData.email': 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
