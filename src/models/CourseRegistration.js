const mongoose = require('mongoose');

const courseRegistrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'ACTIVE', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentRef: {
    type: String,
    default: null
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound unique index - one registration per user per course
courseRegistrationSchema.index({ userId: 1, courseId: 1 }, { unique: true });
courseRegistrationSchema.index({ userId: 1, status: 1 });
courseRegistrationSchema.index({ courseId: 1, status: 1 });

// Check if registration is active (paid or active status)
courseRegistrationSchema.methods.isEnrolled = function() {
  return ['PAID', 'ACTIVE'].includes(this.status);
};

// Static method to check if user is enrolled in a course
courseRegistrationSchema.statics.isUserEnrolled = async function(userId, courseId) {
  const registration = await this.findOne({
    userId,
    courseId,
    status: { $in: ['PAID', 'ACTIVE'] }
  });
  return !!registration;
};

// Static method to get enrolled students for a course
courseRegistrationSchema.statics.getEnrolledStudents = async function(courseId) {
  return this.find({
    courseId,
    status: { $in: ['PAID', 'ACTIVE'] }
  }).populate('userId', 'name email');
};

const CourseRegistration = mongoose.model('CourseRegistration', courseRegistrationSchema);

module.exports = CourseRegistration;
