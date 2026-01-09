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
  },
  duration: {
    type: String,
    trim: true,
    default: null
  },
  thumbnail: {
    type: String,
    default: null
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

courseSchema.index({ isEnabled: 1, isDeleted: 1 });
courseSchema.index({ createdAt: -1 });

courseSchema.virtual('formattedPrice').get(function() {
  return `₦${(this.price / 100).toLocaleString()}`;
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

courseSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

courseSchema.statics.findAvailable = function(query = {}) {
  return this.find({
    ...query,
    isEnabled: true,
    isDeleted: false
  });
};

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
