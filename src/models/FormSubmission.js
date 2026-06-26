const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RegistrationForm',
      required: true,
    },
    formSlug: {
      type: String,
      required: true,
    },
    formTitle: {
      type: String,
      required: true,
    },
    answers: {
      type: Map,
      of: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

formSubmissionSchema.index({ formId: 1, createdAt: -1 });
formSubmissionSchema.index({ formSlug: 1 });

const FormSubmission = mongoose.model('FormSubmission', formSubmissionSchema);

module.exports = FormSubmission;
