const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const { config } = require('../config');

// Cookie options for refresh token
const cookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const register = catchAsync(async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  const { user, accessToken, refreshToken } = await authService.register(req.body, ipAddress);

  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken,
    },
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const { user, accessToken, refreshToken } = await authService.login(email, password, ipAddress);

  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(200).json({
    success: true,
    data: {
      user,
      accessToken,
    },
  });
});

const refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: {
        statusCode: 401,
        message: 'Refresh token is required',
      },
    });
  }

  const tokens = await authService.refreshTokens(refreshToken);

  res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

  res.status(200).json({
    success: true,
    data: {
      accessToken: tokens.accessToken,
    },
  });
});

const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    // Try to get userId from refresh token to clear it from DB
    try {
      const tokenService = require('../services/tokenService');
      const decoded = tokenService.verifyRefreshToken(refreshToken);
      await authService.logout(decoded.userId);
    } catch (error) {
      // Token might be invalid/expired, but we still clear the cookie
    }
  }

  res.clearCookie('refreshToken', cookieOptions);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

const getMe = catchAsync(async (req, res) => {
  const user = await authService.getUserById(req.user.userId);

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
