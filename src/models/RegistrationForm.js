const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['text', 'email', 'tel', 'textarea', 'select'],
      required: true,
    },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] }, // for 'select' fields
    placeholder: { type: String, default: '' },
  },
  { _id: false }
);

const registrationFormSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Form title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    fields: {
      type: [fieldSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    closedMessage: {
      type: String,
      default: 'This form is no longer accepting responses.',
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
    emailNotification: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

registrationFormSchema.index({ slug: 1 });

const RegistrationForm = mongoose.model('RegistrationForm', registrationFormSchema);

module.exports = RegistrationForm;
