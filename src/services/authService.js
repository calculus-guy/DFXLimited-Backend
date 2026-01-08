const User = require('../models/User');
const tokenService = require('./tokenService');
const ApiError = require('../utils/ApiError');

const register = async (userData) => {
  const { email, password, name } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  // Create user
  const user = await User.create({ email, password, name });

  // Generate tokens
  const accessToken = tokenService.generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = tokenService.generateRefreshToken({
    userId: user._id,
  });

  // Store hashed refresh token
  user.refreshToken = tokenService.hashToken(refreshToken);
  await user.save();

  return { user, accessToken, refreshToken };
};

const login = async (email, password) => {
  // Find user with password field
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate tokens
  const accessToken = tokenService.generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = tokenService.generateRefreshToken({
    userId: user._id,
  });

  // Store hashed refresh token
  user.refreshToken = tokenService.hashToken(refreshToken);
  await user.save();

  return { user, accessToken, refreshToken };
};

const refreshTokens = async (refreshToken) => {
  // Verify refresh token
  let decoded;
  try {
    decoded = tokenService.verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  // Find user with refresh token
  const user = await User.findById(decoded.userId).select('+refreshToken');
  
  if (!user || !user.refreshToken) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  // Compare token hash
  if (!tokenService.compareTokenHash(refreshToken, user.refreshToken)) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  // Generate new tokens (token rotation)
  const newAccessToken = tokenService.generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  const newRefreshToken = tokenService.generateRefreshToken({
    userId: user._id,
  });

  // Update stored refresh token hash
  user.refreshToken = tokenService.hashToken(newRefreshToken);
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  getUserById,
};
