const orderService = require('../services/orderService');
const courseRegistrationService = require('../services/courseRegistrationService');
const catchAsync = require('../utils/catchAsync');

/**
 * Admin: Mark order as paid (manual reconciliation)
 */
const markOrderPaid = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.userId;

  const order = await orderService.adminMarkOrderPaid(id, adminId, reason);

  res.status(200).json({
    success: true,
    message: 'Order marked as paid successfully',
    data: { order }
  });
});

/**
 * Admin: Mark order as refunded
 */
const markOrderRefunded = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.userId;

  const order = await orderService.adminMarkOrderRefunded(id, adminId, reason);

  res.status(200).json({
    success: true,
    message: 'Order marked as refunded successfully',
    data: { order }
  });
});

/**
 * Admin: Grant course access
 */
const grantCourseAccess = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.userId;

  const registration = await courseRegistrationService.adminGrantAccess(id, adminId, reason);

  res.status(200).json({
    success: true,
    message: 'Course access granted successfully',
    data: { registration }
  });
});

/**
 * Admin: Revoke course access
 */
const revokeCourseAccess = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.userId;

  const registration = await courseRegistrationService.adminRevokeAccess(id, adminId, reason);

  res.status(200).json({
    success: true,
    message: 'Course access revoked successfully',
    data: { registration }
  });
});

/**
 * Admin: Get all course registrations
 */
const getAllRegistrations = catchAsync(async (req, res) => {
  const { page, limit, status, courseId, userId } = req.query;
  
  const result = await courseRegistrationService.getAllRegistrations(
    { status, courseId, userId },
    { page, limit }
  );

  res.status(200).json({
    success: true,
    data: result
  });
});

module.exports = {
  markOrderPaid,
  markOrderRefunded,
  grantCourseAccess,
  revokeCourseAccess,
  getAllRegistrations
};
