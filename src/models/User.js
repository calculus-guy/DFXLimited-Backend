const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetOtp: {
      type: String,
      select: false,
    },
    passwordResetOtpExpires: {
      type: Date,
      select: false,
    },
    passwordResetAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  
  // Update passwordChangedAt when password is modified (except on new user creation)
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after
  }
  
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generate 6-digit OTP for password reset
 */
userSchema.methods.generatePasswordResetOtp = function () {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash OTP before storing
  this.passwordResetOtp = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  // OTP expires in 15 minutes
  this.passwordResetOtpExpires = Date.now() + 15 * 60 * 1000;
  this.passwordResetAttempts = 0;
  
  return otp; // Return plain OTP to send via email
};

/**
 * Verify OTP for password reset
 */
userSchema.methods.verifyPasswordResetOtp = function (otp) {
  const hashedOtp = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  return this.passwordResetOtp === hashedOtp && 
         this.passwordResetOtpExpires > Date.now();
};

/**
 * Clear password reset fields
 */
userSchema.methods.clearPasswordReset = function () {
  this.passwordResetOtp = undefined;
  this.passwordResetOtpExpires = undefined;
  this.passwordResetAttempts = 0;
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

userSchema.methods.incLoginAttempts = async function () {
  // If previous lock has expired, restart the count
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_DURATION_MS };
  }
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.passwordResetOtp;
  delete user.passwordResetOtpExpires;
  delete user.passwordResetAttempts;
  delete user.loginAttempts;
  delete user.lockUntil;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
