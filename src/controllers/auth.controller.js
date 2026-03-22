const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendTokenResponse, generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Prevent direct admin creation via API
  if (role === 'admin') {
    return res.status(403).json({ success: false, message: 'Cannot register as admin.' });
  }

  const user = await User.create({ name, email, password, role: role || 'buyer' });
  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ success: false, message: 'Account suspended. Contact admin.' });
  }

  // Store refresh token in DB
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'No refresh token provided.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const newAccessToken  = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ success: false, message: 'Refresh token expired or invalid.' });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  res.json({ success: true, message: 'Logged out successfully.' });
});
