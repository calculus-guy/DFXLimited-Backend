const express = require('express');
const promoController = require('../../controllers/admin/promoController');
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/', promoController.listPromos);
router.post('/', promoController.createPromo);
router.patch('/:id', promoController.updatePromo);
router.patch('/:id/toggle', promoController.togglePromo);
router.delete('/:id', promoController.deletePromo);

module.exports = router;
