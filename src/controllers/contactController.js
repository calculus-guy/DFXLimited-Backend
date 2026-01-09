const contactService = require('../services/contactService');
const emailService = require('../services/emailService');

/**
 * Submit contact form (public)
 */
const submit = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const contact = await contactService.createContact(req.body, ipAddress);

    // Send email notification to admin (non-blocking)
    emailService.sendContactInquiryNotification(contact).catch(err => {
      console.error('Failed to send contact notification:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.',
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all contacts (admin)
 */
const getAll = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await contactService.getAllContacts(
      { status },
      { page, limit }
    );

    res.status(200).json({
      success: true,
      message: 'Contacts retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contact by ID (admin)
 */
const getById = async (req, res, next) => {
  try {
    const contact = await contactService.getContactById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Contact retrieved successfully',
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update contact status (admin)
 */
const updateStatus = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const contact = await contactService.updateContactStatus(
      req.params.id,
      req.body.status,
      adminId
    );

    res.status(200).json({
      success: true,
      message: 'Contact status updated successfully',
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contact statistics (admin)
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await contactService.getContactStats();

    res.status(200).json({
      success: true,
      message: 'Contact statistics retrieved successfully',
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submit,
  getAll,
  getById,
  updateStatus,
  getStats
};
