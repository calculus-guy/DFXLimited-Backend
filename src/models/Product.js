const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    images: [{
      type: String,
    }],
    category: {
      type: String,
      trim: true,
    },
    stockStatus: {
      type: String,
      enum: ['IN_STOCK', 'OUT_OF_STOCK'],
      default: 'IN_STOCK',
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Stock quantity cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1, isDeleted: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Update stockStatus based on stockQuantity
productSchema.pre('save', function (next) {
  if (this.stockQuantity <= 0) {
    this.stockStatus = 'OUT_OF_STOCK';
  } else {
    this.stockStatus = 'IN_STOCK';
  }
  next();
});

/**
 * Soft delete method
 */
productSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

/**
 * Static method to find active (non-deleted) products
 */
productSchema.statics.findActive = function (query = {}) {
  return this.find({
    ...query,
    isActive: true,
    isDeleted: false
  });
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
