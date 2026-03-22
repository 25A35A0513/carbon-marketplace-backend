const { verifyAccessToken } = require('../utils/jwt');
const { sendError }         = require('../utils/response');
const User                  = require('../models/User');

/**
 * protect — verifies Bearer token and attaches req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Not authorised — no token', 401);
    }

    const decoded = verifyAccessToken(token);
    const user    = await User.findById(decoded.id).select('-password -refreshToken');

    if (!user) {
      return sendError(res, 'User belonging to this token no longer exists', 401);
    }

    if (user.status === 'suspended') {
      return sendError(res, 'Your account has been suspended', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired — please log in again', 401);
    }
    return sendError(res, 'Invalid token', 401);
  }
};

/**
 * authorize(...roles) — restricts access to given roles
 * Must be used AFTER protect.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return sendError(
      res,
      `Role '${req.user.role}' is not allowed to access this route`,
      403
    );
  }
  next();
};

module.exports = { protect, authorize };
