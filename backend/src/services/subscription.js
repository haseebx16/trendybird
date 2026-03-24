/**
 * RevenueCat subscription verification service.
 * 
 * Server-side subscription checks via RevenueCat REST API.
 * This is the source of truth for subscription status.
 */
const axios = require('axios');
const env = require('../config/env');
const logger = require('../config/logger');
const { cache, cacheKeys } = require('../config/cache');

const REVENUECAT_API_BASE = 'https://api.revenuecat.com/v1';

const SubscriptionService = {
  /**
   * Get subscriber info from RevenueCat.
   * Returns subscription status, active entitlements, and expiry.
   */
  async getSubscriberInfo(appUserId) {
    try {
      const response = await axios.get(
        `${REVENUECAT_API_BASE}/subscribers/${appUserId}`,
        {
          headers: {
            Authorization: `Bearer ${env.revenuecatApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const subscriber = response.data?.subscriber;
      if (!subscriber) return null;

      // Check active entitlements
      const entitlements = subscriber.entitlements || {};
      const activeEntitlements = Object.entries(entitlements)
        .filter(([_, ent]) => ent.expires_date === null || new Date(ent.expires_date) > new Date())
        .map(([name, ent]) => ({
          name,
          productId: ent.product_identifier,
          expiresAt: ent.expires_date,
          purchaseDate: ent.purchase_date,
          store: ent.store,
        }));

      // Determine overall status
      const isActive = activeEntitlements.length > 0;
      const primaryEntitlement = activeEntitlements[0] || null;

      return {
        isActive,
        status: isActive ? 'active' : 'expired',
        entitlements: activeEntitlements,
        expiresAt: primaryEntitlement?.expiresAt || null,
        plan: primaryEntitlement?.productId || null,
        store: primaryEntitlement?.store || null,
        managementUrl: subscriber.management_url || null,
      };
    } catch (err) {
      if (err.response?.status === 404) {
        // Subscriber not found in RevenueCat (hasn't purchased)
        return { isActive: false, status: 'none', entitlements: [] };
      }
      logger.error('RevenueCat API error', {
        appUserId,
        status: err.response?.status,
        error: err.message,
      });
      throw err;
    }
  },

  /**
   * Verify a webhook signature from RevenueCat.
   */
  verifyWebhookSignature(payload, signature) {
    if (!env.revenuecatWebhookSecret) {
      logger.warn('RevenueCat webhook secret not configured — skipping verification');
      return true;
    }
    // RevenueCat uses bearer token auth for webhooks
    return signature === env.revenuecatWebhookSecret;
  },

  /**
   * Invalidate cached subscription status for a user.
   * Called after webhook events to ensure fresh data.
   */
  invalidateCache(userId) {
    const cacheKey = cacheKeys.userSubscription(userId);
    cache.del(cacheKey);
  },
};

module.exports = SubscriptionService;
