/**
 * Webhook routes — RevenueCat subscription events.
 * 
 * POST /api/webhooks/revenuecat
 * 
 * Security: Verified via webhook auth header (shared secret).
 * Does NOT require user JWT — RevenueCat calls this server-to-server.
 */
const express = require('express');
const router = express.Router();
const { webhookLimiter } = require('../middleware/rateLimiter');
const SubscriptionService = require('../services/subscription');
const UserModel = require('../models/user');
const { cache, cacheKeys } = require('../config/cache');
const { RC_EVENTS, SUBSCRIPTION_STATUS } = require('../utils/constants');
const logger = require('../config/logger');
const env = require('../config/env');

// Rate limit webhooks
router.use(webhookLimiter);

/**
 * POST /api/webhooks/revenuecat
 * Handle RevenueCat subscription lifecycle events.
 */
router.post('/revenuecat', async (req, res, next) => {
  try {
    // 1. Verify webhook authenticity
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace('Bearer ', '');

    if (env.revenuecatWebhookSecret && token !== env.revenuecatWebhookSecret) {
      logger.warn('RevenueCat webhook: invalid auth token');
      return res.status(401).json({ error: 'unauthorized' });
    }

    const event = req.body?.event;

    if (!event) {
      return res.status(400).json({ error: 'missing_event' });
    }

    const eventType = event.type;
    const appUserId = event.app_user_id;
    const productId = event.product_id;
    const expiresAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

    logger.info('RevenueCat webhook received', {
      eventType,
      appUserId,
      productId,
    });

    // 2. Find the user (appUserId = Supabase user ID)
    const user = await UserModel.getById(appUserId);

    if (!user) {
      // Try by RevenueCat ID
      const userByRc = await UserModel.getByRevenueCatId(appUserId);
      if (!userByRc) {
        logger.warn('RevenueCat webhook: user not found', { appUserId });
        // Still return 200 to prevent retries
        return res.json({ success: true, message: 'user_not_found' });
      }
    }

    const userId = user?.id || appUserId;

    // 3. Update subscription status based on event type
    let newStatus;
    let newPlan = productId;

    switch (eventType) {
      case RC_EVENTS.INITIAL_PURCHASE:
      case RC_EVENTS.RENEWAL:
        newStatus = SUBSCRIPTION_STATUS.ACTIVE;
        break;

      case RC_EVENTS.CANCELLATION:
        newStatus = SUBSCRIPTION_STATUS.CANCELLED;
        break;

      case RC_EVENTS.EXPIRATION:
        newStatus = SUBSCRIPTION_STATUS.EXPIRED;
        break;

      case RC_EVENTS.BILLING_ISSUE:
        newStatus = SUBSCRIPTION_STATUS.EXPIRED;
        break;

      case RC_EVENTS.PRODUCT_CHANGE:
        newStatus = SUBSCRIPTION_STATUS.ACTIVE;
        newPlan = event.new_product_id || productId;
        break;

      default:
        logger.info('RevenueCat webhook: unhandled event type', { eventType });
        return res.json({ success: true, message: 'event_ignored' });
    }

    // 4. Update user subscription in DB
    await UserModel.updateSubscription(userId, {
      subscriptionStatus: newStatus,
      subscriptionPlan: newPlan,
      subscriptionExpiresAt: expiresAt,
      revenuecatId: appUserId,
    });

    // 5. Record event in subscription history
    await UserModel.recordSubscriptionEvent({
      userId,
      eventType,
      plan: newPlan,
      amountUsd: event.price ? parseFloat(event.price) : null,
      currency: event.currency || 'USD',
      provider: event.store || null,
      revenuecatEventId: event.id || null,
      rawPayload: event,
    });

    // 6. Invalidate subscription cache
    SubscriptionService.invalidateCache(userId);
    cache.del(cacheKeys.userSubscription(userId));

    logger.info('RevenueCat webhook processed', {
      userId,
      eventType,
      newStatus,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error('RevenueCat webhook error', { error: err.message });
    // Return 200 even on error to prevent RevenueCat from retrying
    res.json({ success: false, error: 'internal_error' });
  }
});

module.exports = router;
