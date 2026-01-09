const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: [0, 'Price cannot be negative']
    // Stored in kobo (NGN * 100)
  },
  duration: {
    type: String,
    trim: true,
    default: null
    // e.g., "8 weeks", "3 months"
  },
  thumbnail: {
    type: String,
    default: null
    // Cloudinary URL (optional)
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
courseSchema.index({ isEnabled: 1, isDeleted: 1 });
courseSchema.index({ createdAt: -1 });

// Virtual for formatted price
courseSchema.virtual('formattedPrice').get(function() {
  return `₦${(this.price / 100).toLocaleString()}`;
});

// Ensure virtuals are included in JSON
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

// Soft delete method
courseSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static method to find available courses (public)
courseSchema.statics.findAvailable = function(query = {}) {
  return this.find({
    ...query,
    isEnabled: true,
    isDeleted: false
  });
};

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
