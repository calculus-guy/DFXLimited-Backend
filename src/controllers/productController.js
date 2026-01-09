const productService = require('../services/productService');
const catchAsync = require('../utils/catchAsync');

const getProducts = catchAsync(async (req, res) => {
  const { page, limit, category, inStock, search } = req.query;

  const result = await productService.getProducts(
    { category, inStock, search },
    { page, limit }
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

const getProduct = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  res.status(200).json({
    success: true,
    data: { product },
  });
});

const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);

  res.status(201).json({
    success: true,
    data: { product },
  });
});

const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: { product },
  });
});

const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
