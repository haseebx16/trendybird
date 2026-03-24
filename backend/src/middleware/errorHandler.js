/**
 * Global error handler middleware.
 * Catches all unhandled errors and returns consistent JSON responses.
 */
const logger = require('../config/logger');
const env = require('../config/env');

// 404 handler — place before errorHandler in middleware chain
const notFound = (req, res, next) => {
  res.status(404).json({
    error: 'not_found',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// Global error handler
const errorHandler = (err, req, res, _next) => {
  // Log the full error server-side
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    ip: req.ip,
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build response
  const response = {
    error: err.code || 'internal_error',
    message: env.isProduction
      ? 'An unexpected error occurred. Please try again later.'
      : err.message,
  };

  // Include stack trace in development
  if (!env.isProduction) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
