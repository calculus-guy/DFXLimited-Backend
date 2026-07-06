const User = require('../models/User');
const tokenService = require('./tokenService');
const ApiError = require('../utils/ApiError');
const { sendWelcomeEmail, sendPasswordResetOtp, sendPasswordResetSuccess } = require('./emailService');
const { logActivity } = require('./activityLogService');

const register = async (userData, ipAddress = null) => {
  const { email, password, name, phone } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create({ email, password, name, phone: phone || null });

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
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new ApiError(423, `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`);
  }

  const passwordMatch = await user.comparePassword(password);

  if (!passwordMatch) {
    await user.incLoginAttempts();
    const remainingAttempts = 5 - (user.loginAttempts + 1);
    if (remainingAttempts <= 0) {
      throw new ApiError(423, 'Account locked due to too many failed attempts. Try again in 30 minutes.');
    }
    throw new ApiError(401, `Invalid email or password. ${remainingAttempts} attempt(s) remaining before lockout.`);
  }

  // Reset lockout on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
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

const updateProfile = async (userId, updates) => {
  const allowed = {};
  if (updates.name && typeof updates.name === 'string') {
    const trimmed = updates.name.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      throw new ApiError(400, 'Name must be between 2 and 50 characters');
    }
    allowed.name = trimmed;
  }

  if (updates.phone !== undefined) {
    allowed.phone = updates.phone ? updates.phone.trim() : null;
  }

  if (Object.keys(allowed).length === 0) {
    throw new ApiError(400, 'No valid fields to update');
  }

  const user = await User.findByIdAndUpdate(userId, allowed, { new: true, runValidators: true });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

const forgotPassword = async (email, ipAddress = null) => {
  const user = await User.findOne({ email });
  
  if (!user) {
    return { message: 'If the email exists, an OTP has been sent' };
  }

  const otp = user.generatePasswordResetOtp();
  await user.save();

  // Send OTP email
  sendPasswordResetOtp(user, otp).catch((err) => {
    console.error('Failed to send password reset OTP:', err.message);
  });

  // Log activity
  logActivity({
    action: 'PASSWORD_RESET_REQUESTED',
    actor: user._id,
    actorType: 'USER',
    targetType: 'USER',
    targetId: user._id,
    metadata: { email: user.email },
    ipAddress
  });

  return { message: 'If the email exists, an OTP has been sent' };
};

const verifyOtp = async (email, otp) => {
  const user = await User.findOne({ email }).select('+passwordResetOtp +passwordResetOtpExpires +passwordResetAttempts');
  
  if (!user) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  const isValid = user.verifyPasswordResetOtp(otp);
  await user.save();

  if (!isValid) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  return { message: 'OTP verified successfully', verified: true };
};

const resetPassword = async (email, otp, newPassword, ipAddress = null) => {
  const user = await User.findOne({ email }).select('+passwordResetOtp +passwordResetOtpExpires +passwordResetAttempts +password');
  
  if (!user) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  const isValid = user.verifyPasswordResetOtp(otp);
  
  if (!isValid) {
    await user.save();
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  // Update password
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  user.clearPasswordReset();
  
  // Invalidate all refresh tokens by clearing the stored one
  user.refreshToken = null;
  
  await user.save();

  // Send success email
  sendPasswordResetSuccess(user).catch((err) => {
    console.error('Failed to send password reset success email:', err.message);
  });

  // Log activity
  logActivity({
    action: 'PASSWORD_RESET_COMPLETED',
    actor: user._id,
    actorType: 'USER',
    targetType: 'USER',
    targetId: user._id,
    metadata: { email: user.email },
    ipAddress
  });

  return { message: 'Password reset successfully' };
};

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  getUserById,
  updateProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
