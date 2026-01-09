const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('./activityLogService');

const getProducts = async (filters = {}, pagination = {}) => {
  const { category, inStock, search } = filters;
  const { page = 1, limit = 10 } = pagination;

  // Exclude soft-deleted products
  const query = { isActive: true, isDeleted: { $ne: true } };

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
  const product = await Product.findOne({ _id: id, isActive: true, isDeleted: { $ne: true } });
  
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
};

const createProduct = async (data, adminId = null) => {
  const product = await Product.create(data);

  // Log activity
  logActivity({
    action: 'PRODUCT_CREATED',
    actor: adminId,
    actorType: 'ADMIN',
    targetType: 'PRODUCT',
    targetId: product._id,
    metadata: { name: product.name, price: product.price, category: product.category }
  });

  return product;
};

const updateProduct = async (id, data, adminId = null) => {
  const product = await Product.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Log activity
  logActivity({
    action: 'PRODUCT_UPDATED',
    actor: adminId,
    actorType: 'ADMIN',
    targetType: 'PRODUCT',
    targetId: product._id,
    metadata: { name: product.name, updatedFields: Object.keys(data) }
  });

  return product;
};

const deleteProduct = async (id, adminId = null) => {
  const product = await Product.findById(id);

  if (!product || product.isDeleted) {
    throw new ApiError(404, 'Product not found');
  }

  // Use soft delete method
  await product.softDelete();

  // Log activity
  logActivity({
    action: 'PRODUCT_DELETED',
    actor: adminId,
    actorType: 'ADMIN',
    targetType: 'PRODUCT',
    targetId: product._id,
    metadata: { name: product.name }
  });

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
    isDeleted: { $ne: true },
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
