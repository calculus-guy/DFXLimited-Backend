const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  title: {
    type: String,
    required: [true, 'Material title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  weekNumber: {
    type: Number,
    required: [true, 'Week number is required'],
    min: [1, 'Week number must be at least 1']
  },
  label: {
    type: String,
    trim: true,
    maxlength: [100, 'Label cannot exceed 100 characters'],
    default: null
    // e.g., "Introduction", "Advanced Topics"
  },
  cloudinaryPublicId: {
    type: String,
    required: [true, 'Cloudinary public ID is required']
  },
  secureUrl: {
    type: String,
    required: [true, 'Secure URL is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
    // Size in bytes
  },
  originalFilename: {
    type: String,
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader ID is required']
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
courseMaterialSchema.index({ courseId: 1, weekNumber: 1 });
courseMaterialSchema.index({ courseId: 1, isDeleted: 1 });
courseMaterialSchema.index({ courseId: 1, createdAt: -1 });

// Virtual for formatted file size
courseMaterialSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
});

// Ensure virtuals are included in JSON
courseMaterialSchema.set('toJSON', { virtuals: true });
courseMaterialSchema.set('toObject', { virtuals: true });

// Soft delete method
courseMaterialSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static method to find materials for a course (non-deleted)
courseMaterialSchema.statics.findByCourse = function(courseId, includeDeleted = false) {
  const query = { courseId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return this.find(query).sort({ weekNumber: 1, createdAt: 1 });
};

const CourseMaterial = mongoose.model('CourseMaterial', courseMaterialSchema);

module.exports = CourseMaterial;
