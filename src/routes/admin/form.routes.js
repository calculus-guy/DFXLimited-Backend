const express = require('express');
const {
  listForms,
  createForm,
  getForm,
  updateForm,
  toggleForm,
  deleteForm,
  getSubmissions,
} = require('../../controllers/admin/formController');
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('ADMIN'));

router.get('/', listForms);
router.post('/', createForm);
router.get('/:id', getForm);
router.patch('/:id', updateForm);
router.patch('/:id/toggle', toggleForm);
router.delete('/:id', deleteForm);
router.get('/:id/submissions', getSubmissions);

module.exports = router;
