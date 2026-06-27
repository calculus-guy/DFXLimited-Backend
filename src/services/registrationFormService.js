const RegistrationForm = require('../models/RegistrationForm');
const FormSubmission = require('../models/FormSubmission');
const emailService = require('./emailService');
const ApiError = require('../utils/ApiError');

// Default fields every new form starts with
const DEFAULT_FIELDS = [
  { id: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name' },
  { id: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Enter your email address' },
  { id: 'phone', label: 'Phone / WhatsApp Number', type: 'tel', required: true, placeholder: 'e.g. +2348012345678' },
  { id: 'course', label: 'Course', type: 'select', required: true, options: [], placeholder: 'Select a course' },
];

const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const generateUniqueSlug = async (title) => {
  let base = slugify(title);
  let slug = base;
  let count = 1;
  while (await RegistrationForm.exists({ slug })) {
    slug = `${base}-${count++}`;
  }
  return slug;
};

// ── Admin operations ──────────────────────────────────────────────

const createForm = async ({ title, description, fields, closedMessage, emailNotification }) => {
  const slug = await generateUniqueSlug(title);
  const formFields = fields && fields.length > 0 ? fields : DEFAULT_FIELDS;

  const form = await RegistrationForm.create({
    title,
    slug,
    description: description || null,
    fields: formFields,
    closedMessage: closedMessage || 'This form is no longer accepting responses.',
    emailNotification: emailNotification !== false,
  });

  return form;
};

const listForms = async () => {
  return RegistrationForm.find().sort({ createdAt: -1 });
};

const getFormById = async (id) => {
  const form = await RegistrationForm.findById(id);
  if (!form) throw new ApiError(404, 'Form not found');
  return form;
};

const updateForm = async (id, updates) => {
  const allowed = {};
  if (updates.title !== undefined) allowed.title = updates.title;
  if (updates.description !== undefined) allowed.description = updates.description;
  if (updates.fields !== undefined) allowed.fields = updates.fields;
  if (updates.closedMessage !== undefined) allowed.closedMessage = updates.closedMessage;
  if (updates.emailNotification !== undefined) allowed.emailNotification = updates.emailNotification;

  const form = await RegistrationForm.findByIdAndUpdate(id, allowed, { new: true, runValidators: true });
  if (!form) throw new ApiError(404, 'Form not found');
  return form;
};

const toggleForm = async (id) => {
  const form = await RegistrationForm.findById(id);
  if (!form) throw new ApiError(404, 'Form not found');
  form.isActive = !form.isActive;
  await form.save();
  return form;
};

const deleteForm = async (id) => {
  const form = await RegistrationForm.findByIdAndDelete(id);
  if (!form) throw new ApiError(404, 'Form not found');
  await FormSubmission.deleteMany({ formId: id });
  return form;
};

const getSubmissions = async (formId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [submissions, total] = await Promise.all([
    FormSubmission.find({ formId }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    FormSubmission.countDocuments({ formId }),
  ]);
  return {
    submissions,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  };
};

// ── Public operations ─────────────────────────────────────────────

const getPublicForm = async (slug) => {
  const form = await RegistrationForm.findOne({ slug }).select('-submissionCount -emailNotification');
  if (!form) throw new ApiError(404, 'Form not found');
  return form;
};

const submitForm = async (slug, answers, ipAddress) => {
  const form = await RegistrationForm.findOne({ slug });
  if (!form) throw new ApiError(404, 'Form not found');
  if (!form.isActive) throw new ApiError(403, form.closedMessage || 'This form is no longer accepting responses.');

  // Validate required fields
  for (const field of form.fields) {
    if (field.required && !answers[field.id]?.toString().trim()) {
      throw new ApiError(400, `"${field.label}" is required`);
    }
  }

  // Store only known field ids
  const cleanAnswers = {};
  for (const field of form.fields) {
    if (answers[field.id] !== undefined) {
      cleanAnswers[field.id] = String(answers[field.id]).trim();
    }
  }

  const submission = await FormSubmission.create({
    formId: form._id,
    formSlug: slug,
    formTitle: form.title,
    answers: cleanAnswers,
    ipAddress: ipAddress || null,
  });

  // Increment counter
  await RegistrationForm.findByIdAndUpdate(form._id, { $inc: { submissionCount: 1 } });

  // Email notification
  if (form.emailNotification) {
    try {
      await emailService.sendFormSubmissionAlert(form, submission, cleanAnswers);
    } catch (err) {
      console.error('Failed to send form submission email:', err.message);
    }
  }

  return submission;
};

module.exports = {
  DEFAULT_FIELDS,
  createForm,
  listForms,
  getFormById,
  updateForm,
  toggleForm,
  deleteForm,
  getSubmissions,
  getPublicForm,
  submitForm,
};
