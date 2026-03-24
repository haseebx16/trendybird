/**
 * Rate limiting & slow-down middleware.
 * 
 * Strategy:
 * - Global rate limit: prevent DDoS / abuse
 * - Per-user rate limit: prevent individual abuse (keyed by user ID)
 * - Slow-down: gradually increase response times under heavy load
 * - Stricter limits for auth endpoints (brute force protection)
 */
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const env = require('../config/env');

// Global rate limiter — applies to all requests
const globalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,       // 15 minutes
  max: env.rateLimitMaxRequests,         // 100 requests per window
  standardHeaders: true,                  // Return rate limit info in headers
  legacyHeaders: false,
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many requests. Please try again later.',
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
});

// Strict limiter for auth-related endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,             // 15 minutes
  max: 10,                               // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many authentication attempts. Please wait 15 minutes.',
  },
});

// Webhook limiter — generous but bounded
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,                  // 1 minute
  max: 30,                               // 30 webhook calls per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many webhook calls.',
  },
});

// Speed limiter — gradually slow responses under heavy load
const speedLimiter = slowDown({
  windowMs: env.rateLimitWindowMs,
  delayAfter: Math.floor(env.rateLimitMaxRequests * 0.7),  // start slowing at 70% of limit
  delayMs: (hits) => hits * 100,         // each subsequent req adds 100ms delay
});

module.exports = {
  globalLimiter,
  authLimiter,
  webhookLimiter,
  speedLimiter,
};
