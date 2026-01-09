const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

const getProducts = async (filters = {}, pagination = {}) => {
  const { category, inStock, search } = filters;
  const { page = 1, limit = 10 } = pagination;

  const query = { isActive: true };

  if (category) {
    query.category = category;
  }

  if (inStock !== undefined) {
    query.stockStatus = inStock === 'true' || inStock === true ? 'IN_STOCK' : 'OUT_OF_STOCK';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getProductById = async (id) => {
  const product = await Product.findOne({ _id: id, isActive: true });
  
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
};

const createProduct = async (data) => {
  const product = await Product.create(data);
  return product;
};

const updateProduct = async (id, data) => {
  const product = await Product.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
};

const updateStock = async (productId, quantityToDeduct) => {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  product.stockQuantity = Math.max(0, product.stockQuantity - quantityToDeduct);
  await product.save();

  return product;
};

const getProductsByIds = async (productIds) => {
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  });

  return products;
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductsByIds,
};
