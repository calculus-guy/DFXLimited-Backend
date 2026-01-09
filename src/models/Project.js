const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['FINTECH', 'HEALTH', 'TRAVEL', 'ERP', 'ECOMMERCE', 'EDUCATION', 'OTHER']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  fullDescription: {
    type: String,
    maxlength: [5000, 'Full description cannot exceed 5000 characters'],
    default: null
  },
  coverImageUrl: {
    type: String,
    required: [true, 'Cover image URL is required']
  },
  caseStudyUrl: {
    type: String,
    default: null
  },
  isPublished: {
    type: Boolean,
    default: false
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
projectSchema.index({ isPublished: 1, createdAt: -1 });
projectSchema.index({ category: 1, isPublished: 1 });

// Virtual for category display name
projectSchema.virtual('categoryDisplay').get(function() {
  const displayNames = {
    'FINTECH': 'FinTech',
    'HEALTH': 'Healthcare',
    'TRAVEL': 'Travel',
    'ERP': 'ERP System',
    'ECOMMERCE': 'E-commerce',
    'EDUCATION': 'Education',
    'OTHER': 'Other'
  };
  return displayNames[this.category] || this.category;
});

// Ensure virtuals are included in JSON
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

// Static method to find published projects
projectSchema.statics.findPublished = function(query = {}) {
  return this.find({
    ...query,
    isPublished: true
  });
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
