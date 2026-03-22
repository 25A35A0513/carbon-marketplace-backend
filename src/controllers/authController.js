const User                                   = require('../models/User');
const { signAccessToken, signRefreshToken,
        verifyRefreshToken }                  = require('../utils/jwt');
const { sendSuccess, sendError }             = require('../utils/response');
const { asyncHandler }                       = require('../middleware/errorHandler');

// ── helpers ──────────────────────────────────────────────
const issueTokens = (user) => ({
  accessToken:  signAccessToken({ id: user._id, role: user.role }),
  refreshToken: signRefreshToken({ id: user._id }),
});

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 'Email already registered', 409);

  const user = await User.create({ name, email, password, role: role || 'buyer' });

  const tokens = issueTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(
    res,
    { user: user.toPublic(), ...tokens },
    'Registration successful',
    201
  );
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user || !(await user.comparePassword(password))) {
    return sendError(res, 'Invalid email or password', 401);
  }

  if (user.status === 'suspended') {
    return sendError(res, 'Your account has been suspended', 403);
  }

  const tokens = issueTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, { user: user.toPublic(), ...tokens }, 'Login successful');
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return sendError(res, 'Refresh token required', 400);

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return sendError(res, 'Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    return sendError(res, 'Refresh token revoked or invalid', 401);
  }

  const tokens = issueTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, tokens, 'Tokens refreshed');
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+refreshToken');
  if (user) {
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });
  }
  return sendSuccess(res, null, 'Logged out successfully');
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return sendSuccess(res, user.toPublic());
});

module.exports = { register, login, refresh, logout, getMe };
