const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  company: {
    type: String,
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters'],
    default: null
  },
  serviceType: {
    type: String,
    enum: ['WEB_APP', 'MOBILE_APP', 'IT_INFRASTRUCTURE', 'CLOUD_COMPUTING', 'SERVER_DEPLOYMENT', 'IOT_INTEGRATION', 'NETWORK_SECURITY', 'NETWORK_SETUP', null],
    default: null
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  status: {
    type: String,
    enum: ['NEW', 'READ', 'REPLIED'],
    default: 'NEW'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ createdAt: -1 });

// Virtual for service type display name
contactMessageSchema.virtual('serviceTypeDisplay').get(function() {
  const displayNames = {
    'WEB_APP': 'Web Application',
    'MOBILE_APP': 'Mobile Application',
    'IT_INFRASTRUCTURE': 'IT Infrastructure Management',
    'CLOUD_COMPUTING': 'Cloud Computing Services',
    'SERVER_DEPLOYMENT': 'Server Deployment and Installation',
    'IOT_INTEGRATION': 'IoT Integration for Factory',
    'NETWORK_SECURITY': 'Network Security',
    'NETWORK_SETUP': 'Network Setup and Integration'
  };
  return this.serviceType ? displayNames[this.serviceType] : null;
});

// Ensure virtuals are included in JSON
contactMessageSchema.set('toJSON', { virtuals: true });
contactMessageSchema.set('toObject', { virtuals: true });

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

module.exports = ContactMessage;