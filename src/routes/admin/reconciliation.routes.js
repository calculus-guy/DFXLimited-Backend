const express = require('express');
const reconciliationController = require('../../controllers/reconciliationController');
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');
const validate = require('../../middleware/validate');
const { 
  reconciliationReasonSchema, 
  registrationFilterSchema 
} = require('../../validators/reconciliation.validator');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

// Order reconciliation
router.post(
  '/orders/:id/mark-paid',
  validate(reconciliationReasonSchema),
  reconciliationController.markOrderPaid
);

router.post(
  '/orders/:id/mark-refunded',
  validate(reconciliationReasonSchema),
  reconciliationController.markOrderRefunded
);

// Course registration reconciliation
router.get(
  '/registrations',
  validate(registrationFilterSchema, 'query'),
  reconciliationController.getAllRegistrations
);

router.post(
  '/registrations/:id/grant-access',
  validate(reconciliationReasonSchema),
  reconciliationController.grantCourseAccess
);

router.post(
  '/registrations/:id/revoke-access',
  validate(reconciliationReasonSchema),
  reconciliationController.revokeCourseAccess
);

module.exports = router;
