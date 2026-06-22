const PromoCode = require('../models/PromoCode');
const ApiError = require('../utils/ApiError');

const validatePromoCode = async (code, orderAmountKobo) => {
  const promo = await PromoCode.findOne({ code: code.toUpperCase() });

  if (!promo) {
    throw new ApiError(404, 'Invalid promo code');
  }

  if (!promo.isActive) {
    throw new ApiError(400, 'This promo code is no longer active');
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    throw new ApiError(400, 'This promo code has expired');
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    throw new ApiError(400, 'This promo code has reached its usage limit');
  }

  if (promo.minOrderAmount > 0 && orderAmountKobo < promo.minOrderAmount) {
    const minNaira = (promo.minOrderAmount / 100).toLocaleString('en-NG');
    throw new ApiError(400, `Minimum order amount of ₦${minNaira} required for this code`);
  }

  // Calculate discount in kobo
  let discountAmount;
  if (promo.discountType === 'PERCENTAGE') {
    discountAmount = Math.round((orderAmountKobo * promo.discountValue) / 100);
  } else {
    // FIXED — discountValue stored in kobo
    discountAmount = Math.min(promo.discountValue, orderAmountKobo);
  }

  return {
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountAmount, // in kobo
    description: promo.description,
  };
};

const applyPromoCode = async (code) => {
  await PromoCode.findOneAndUpdate(
    { code: code.toUpperCase() },
    { $inc: { usedCount: 1 } }
  );
};

module.exports = { validatePromoCode, applyPromoCode };
