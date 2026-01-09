const User = require('../models/User');
const tokenService = require('./tokenService');
const ApiError = require('../utils/ApiError');
const { sendWelcomeEmail } = require('./emailService');
const { logActivity } = require('./activityLogService');

const register = async (userData, ipAddress = null) => {
  const { email, password, name } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create({ email, password, name });

  const accessToken = tokenService.generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = tokenService.generateRefreshToken({
    userId: user._id,
  });

  user.refreshToken = tokenService.hashToken(refreshToken);
  await user.save();

  sendWelcomeEmail(user).catch((err) => {
    console.error('Failed to send welcome email:', err.message);
  });

  // Log activity
  logActivity({
    action: 'USER_REGISTERED',
    actor: user._id,
    actorType: 'USER',
    targetType: 'USER',
    targetId: user._id,
    metadata: { email: user.email, name: user.name },
    ipAddress
  });

  return { user, accessToken, refreshToken };
};

const login = async (email, password, ipAddress = null) => {
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = tokenService.generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = tokenService.generateRefreshToken({
    userId: user._id,
  });

  user.refreshToken = tokenService.hashToken(refreshToken);
  await user.save();

  // Log activity
  logActivity({
    action: 'USER_LOGIN',
    actor: user._id,
    actorType: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
    targetType: 'USER',
    targetId: user._id,
    metadata: { email: user.email },
    ipAddress
  });

  return { user, accessToken, refreshToken };
};

const refreshTokens = async (refreshToken) => {
  let decoded;
  try {
    decoded = tokenService.verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.userId).select('+refreshToken');
  
  if (!user || !user.refreshToken) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  if (!tokenService.compareTokenHash(refreshToken, user.refreshToken)) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const newAccessToken = tokenService.generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  const newRefreshToken = tokenService.generateRefreshToken({
    userId: user._id,
  });

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
