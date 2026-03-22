const jwt = require('jsonwebtoken');

/**
 * Sign an access token (short-lived).
 */
const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

/**
 * Sign a refresh token (long-lived).
 */
const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });

/**
 * Verify an access token. Returns decoded payload or throws.
 */
const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

/**
 * Verify a refresh token. Returns decoded payload or throws.
 */
const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
