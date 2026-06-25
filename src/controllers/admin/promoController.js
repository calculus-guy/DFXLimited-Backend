const PromoCode = require('../../models/PromoCode');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');

const listPromos = catchAsync(async (req, res) => {
  const promos = await PromoCode.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { promos } });
});

const createPromo = catchAsync(async (req, res) => {
  const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt, description } = req.body;

  if (!code || !discountType || discountValue === undefined) {
    throw new ApiError(400, 'code, discountType, and discountValue are required');
  }

  if (!['PERCENTAGE', 'FIXED'].includes(discountType)) {
    throw new ApiError(400, 'discountType must be PERCENTAGE or FIXED');
  }

  if (discountType === 'PERCENTAGE' && (discountValue <= 0 || discountValue > 100)) {
    throw new ApiError(400, 'Percentage discount must be between 1 and 100');
  }

  const existing = await PromoCode.findOne({ code: code.toUpperCase() });
  if (existing) {
    throw new ApiError(409, 'A promo code with this name already exists');
  }

  const promo = await PromoCode.create({
    code: code.toUpperCase().trim(),
    discountType,
    discountValue,
    minOrderAmount: minOrderAmount || 0,
    maxUses: maxUses || null,
    expiresAt: expiresAt || null,
    description: description || null,
    isActive: true,
  });

  res.status(201).json({ success: true, data: { promo } });
});

const updatePromo = catchAsync(async (req, res) => {
  const { discountValue, minOrderAmount, maxUses, expiresAt, description, isActive } = req.body;

  const promo = await PromoCode.findByIdAndUpdate(
    req.params.id,
    { discountValue, minOrderAmount, maxUses, expiresAt, description, isActive },
    { new: true, runValidators: true }
  );

  if (!promo) throw new ApiError(404, 'Promo code not found');

  res.status(200).json({ success: true, data: { promo } });
});

const togglePromo = catchAsync(async (req, res) => {
  const promo = await PromoCode.findById(req.params.id);
  if (!promo) throw new ApiError(404, 'Promo code not found');

  promo.isActive = !promo.isActive;
  await promo.save();

  res.status(200).json({ success: true, data: { promo } });
});

const deletePromo = catchAsync(async (req, res) => {
  const promo = await PromoCode.findByIdAndDelete(req.params.id);
  if (!promo) throw new ApiError(404, 'Promo code not found');

  res.status(200).json({ success: true, message: 'Promo code deleted successfully' });
});

module.exports = { listPromos, createPromo, updatePromo, togglePromo, deletePromo };
