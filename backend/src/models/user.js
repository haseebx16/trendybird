/**
 * User model — Supabase queries for users table.
 */
const { supabaseAdmin } = require('../config/supabase');
const logger = require('../config/logger');

const UserModel = {
  /**
   * Get user profile by ID.
   */
  async getById(userId) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Failed to fetch user', { userId, error: error.message });
      return null;
    }
    return data;
  },

  /**
   * Get user by RevenueCat ID.
   */
  async getByRevenueCatId(rcId) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('revenuecat_id', rcId)
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Update subscription status (called by RevenueCat webhook).
   */
  async updateSubscription(userId, {
    subscriptionStatus,
    subscriptionPlan,
    subscriptionExpiresAt,
    revenuecatId,
  }) {
    const updates = {};
    if (subscriptionStatus !== undefined) updates.subscription_status = subscriptionStatus;
    if (subscriptionPlan !== undefined) updates.subscription_plan = subscriptionPlan;
    if (subscriptionExpiresAt !== undefined) updates.subscription_expires_at = subscriptionExpiresAt;
    if (revenuecatId !== undefined) updates.revenuecat_id = revenuecatId;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update subscription', { userId, error: error.message });
      throw error;
    }
    return data;
  },

  /**
   * Update user preferences.
   */
  async updatePreferences(userId, { preferredCountry, preferredCategories }) {
    const updates = {};
    if (preferredCountry) updates.preferred_country = preferredCountry;
    if (preferredCategories) updates.preferred_categories = preferredCategories;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update preferences', { userId, error: error.message });
      throw error;
    }
    return data;
  },

  /**
   * Update last_seen_at timestamp.
   */
  async touch(userId) {
    await supabaseAdmin
      .from('users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId);
  },

  /**
   * Record subscription event in history.
   */
  async recordSubscriptionEvent(event) {
    const { error } = await supabaseAdmin
      .from('subscription_history')
      .insert({
        user_id: event.userId,
        event_type: event.eventType,
        plan: event.plan || null,
        amount_usd: event.amountUsd || null,
        currency: event.currency || 'USD',
        provider: event.provider || null,
        revenuecat_event_id: event.revenuecatEventId || null,
        raw_payload: event.rawPayload || {},
      });

    if (error) {
      logger.error('Failed to record subscription event', { error: error.message });
    }
  },
};

module.exports = UserModel;
