/**
 * Authentication middleware.
 * Verifies Supabase JWT from Authorization header.
 * Attaches user object to req.user.
 */
const { supabaseAdmin } = require('../config/supabase');
const logger = require('../config/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'No token provided.',
      });
    }

    // Verify the JWT using Supabase admin client
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.warn('Auth failed: invalid token', { error: error?.message });
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Invalid or expired token.',
      });
    }

    // Attach user info to the request
    req.user = {
      id: user.id,
      email: user.email,
      token, // pass through for user-scoped Supabase queries if needed
    };

    next();
  } catch (err) {
    logger.error('Auth middleware error', { error: err.message });
    return res.status(500).json({
      error: 'internal_error',
      message: 'Authentication service unavailable.',
    });
  }
};

module.exports = { authenticate };
