const logger = require('../utils/logger');

/**
 * Central error-handling middleware.
 * Must be registered LAST in app.js (after all routes).
 */
const errorHandler = (err, req, res, next) => {       // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // ── Mongoose: duplicate key ────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message    = `Duplicate value for '${field}'. Please use another value.`;
    statusCode = 409;
  }

  // ── Mongoose: validation error ─────────────────────────
  if (err.name === 'ValidationError') {
    message    = Object.values(err.errors).map((e) => e.message).join(', ');
    statusCode = 400;
  }

  // ── Mongoose: bad ObjectId ─────────────────────────────
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    message    = `Resource not found — invalid id '${err.value}'`;
    statusCode = 404;
  }

  // ── JWT errors ─────────────────────────────────────────
  if (err.name === 'JsonWebTokenError')  { message = 'Invalid token';  statusCode = 401; }
  if (err.name === 'TokenExpiredError')  { message = 'Token expired';  statusCode = 401; }

  if (statusCode === 500) {
    logger.error(`[${req.method}] ${req.originalUrl} — ${err.stack}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Wrap async route handlers to forward errors to errorHandler.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
