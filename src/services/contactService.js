const ContactMessage = require('../models/ContactMessage');
const ApiError = require('../utils/ApiError');

/**
 * Create a new contact message
 */
const createContact = async (contactData) => {
  const contact = await ContactMessage.create(contactData);
  return contact;
};

/**
 * Get contact by ID
 */
const getContactById = async (id) => {
  const contact = await ContactMessage.findById(id);
  
  if (!contact) {
    throw new ApiError(404, 'Contact message not found');
  }
  
  return contact;
};

/**
 * Get all contacts with filtering and pagination
 */
const getAllContacts = async (filters = {}, pagination = {}) => {
  const { status } = filters;
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const query = {};
  if (status) {
    query.status = status;
  }

  const [contacts, total] = await Promise.all([
    ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    ContactMessage.countDocuments(query)
  ]);

  return {
    contacts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update contact status
 */
const updateContactStatus = async (id, status) => {
  const validStatuses = ['NEW', 'READ', 'REPLIED'];
  
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid status value');
  }

  const contact = await ContactMessage.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!contact) {
    throw new ApiError(404, 'Contact message not found');
  }

  return contact;
};

/**
 * Get contact statistics
 */
const getContactStats = async () => {
  const stats = await ContactMessage.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    NEW: 0,
    READ: 0,
    REPLIED: 0,
    total: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};

module.exports = {
  createContact,
  getContactById,
  getAllContacts,
  updateContactStatus,
  getContactStats
};
