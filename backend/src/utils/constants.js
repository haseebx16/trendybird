/**
 * Application-wide constants.
 */

// Supported data sources
const SOURCES = {
  GOOGLE_TRENDS: 'google_trends',
  YOUTUBE: 'youtube',
  REDDIT: 'reddit',
};

// Subscription statuses
const SUBSCRIPTION_STATUS = {
  NONE: 'none',
  TRIAL: 'trial',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

// Active subscription statuses (allowed through paywall)
const ACTIVE_SUBSCRIPTION_STATUSES = [
  SUBSCRIPTION_STATUS.TRIAL,
  SUBSCRIPTION_STATUS.ACTIVE,
];

// RevenueCat webhook event types
const RC_EVENTS = {
  INITIAL_PURCHASE: 'INITIAL_PURCHASE',
  RENEWAL: 'RENEWAL',
  CANCELLATION: 'CANCELLATION',
  EXPIRATION: 'EXPIRATION',
  BILLING_ISSUE: 'BILLING_ISSUE',
  PRODUCT_CHANGE: 'PRODUCT_CHANGE',
  SUBSCRIBER_ALIAS: 'SUBSCRIBER_ALIAS',
  TRANSFER: 'TRANSFER',
};

// Score weights for Trend Momentum Engine
const SCORE_WEIGHTS = {
  VELOCITY: 0.35,       // how fast it's growing
  FRESHNESS: 0.25,      // inverse of saturation
  CROSS_PLATFORM: 0.25, // appears on multiple sources
  VOLUME: 0.15,         // raw volume signal
};

// Score thresholds
const SCORE_THRESHOLDS = {
  EXPLODING: 85,   // 🔥 about to explode
  HOT: 65,         // 🔴 very hot
  RISING: 45,      // 🟠 clearly rising
  WARM: 25,        // 🟡 warm signal
  COLD: 0,         // 🔵 barely registering
};

// Countries to fetch per cron cycle (batched to stay under free-tier limits)
// Cycle through all countries over multiple cron runs
const CRON_BATCH_SIZE = 5;

// Max results per API call
const MAX_TRENDS_PER_FETCH = 20;
const MAX_YOUTUBE_RESULTS = 25;
const MAX_REDDIT_RESULTS = 25;

// Pagination
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

module.exports = {
  SOURCES,
  SUBSCRIPTION_STATUS,
  ACTIVE_SUBSCRIPTION_STATUSES,
  RC_EVENTS,
  SCORE_WEIGHTS,
  SCORE_THRESHOLDS,
  CRON_BATCH_SIZE,
  MAX_TRENDS_PER_FETCH,
  MAX_YOUTUBE_RESULTS,
  MAX_REDDIT_RESULTS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
};
