/**
 * Hard Paywall Middleware.
 * Checks user has an active subscription before accessing protected endpoints.
 * 
 * Strategy:
 * 1. Check in-memory cache first (avoid DB hit on every request)
 * 2. If not cached, query users table for subscription_status
 * 3. If not active, reject with 403
 */
const { supabaseAdmin } = require('../config/supabase');
const { cache, cacheKeys } = require('../config/cache');
const { ACTIVE_SUBSCRIPTION_STATUSES } = require('../utils/constants');
const logger = require('../config/logger');

const requireSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required.',
      });
    }

    // 1. Check cache first
    const cacheKey = cacheKeys.userSubscription(userId);
    const cachedStatus = cache.get(cacheKey);

    if (cachedStatus !== undefined) {
      if (ACTIVE_SUBSCRIPTION_STATUSES.includes(cachedStatus)) {
        req.subscriptionStatus = cachedStatus;
        return next();
      }
      return res.status(403).json({
        error: 'subscription_required',
        message: 'An active subscription is required to access this resource.',
        subscription_status: cachedStatus,
      });
    }

    // 2. Query the database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('subscription_status, subscription_expires_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      logger.warn('Subscription check failed: user not found', { userId });
      return res.status(403).json({
        error: 'subscription_required',
        message: 'Unable to verify subscription. Please ensure your account is set up.',
      });
    }

    const status = user.subscription_status || 'none';

    // Check if subscription has expired (belt-and-suspenders with RevenueCat webhooks)
    if (
      user.subscription_expires_at &&
      new Date(user.subscription_expires_at) < new Date() &&
      status === 'active'
    ) {
      // Subscription expired but status not yet updated — mark as expired
      await supabaseAdmin
        .from('users')
        .update({ subscription_status: 'expired' })
        .eq('id', userId);

      cache.set(cacheKey, 'expired', 300); // cache for 5 min
      return res.status(403).json({
        error: 'subscription_required',
        message: 'Your subscription has expired. Please renew to continue.',
        subscription_status: 'expired',
      });
    }

    // 3. Cache the status (5 min TTL — balance between freshness and DB load)
    cache.set(cacheKey, status, 300);

    if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(status)) {
      return res.status(403).json({
        error: 'subscription_required',
        message: 'An active subscription is required to access this resource.',
        subscription_status: status,
      });
    }

    req.subscriptionStatus = status;
    next();
  } catch (err) {
    logger.error('Subscription middleware error', { error: err.message });
    return res.status(500).json({
      error: 'internal_error',
      message: 'Subscription verification service unavailable.',
    });
  }
};

module.exports = { requireSubscription };
