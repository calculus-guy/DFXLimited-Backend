const promoService = require('../services/promoService');
const ApiError = require('../utils/ApiError');

const validatePromo = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      throw new ApiError(400, 'Promo code is required');
    }

    if (typeof orderAmount !== 'number' || orderAmount < 0) {
      throw new ApiError(400, 'orderAmount (in kobo) is required');
    }

    const result = await promoService.validatePromoCode(code, orderAmount);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { validatePromo };
