/**
 * Environment configuration with validation.
 * Fails fast at startup if required vars are missing.
 */
const dotenv = require('dotenv');
const path = require('path');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key, defaultValue) => process.env[key] || defaultValue;

module.exports = {
  // Server
  nodeEnv: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '3000'), 10),
  isProduction: optional('NODE_ENV', 'development') === 'production',

  // Supabase
  supabaseUrl: required('SUPABASE_URL'),
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseJwtSecret: required('SUPABASE_JWT_SECRET'),

  // External APIs
  youtubeApiKey: required('YOUTUBE_API_KEY'),
  redditClientId: optional('REDDIT_CLIENT_ID', ''),
  redditClientSecret: optional('REDDIT_CLIENT_SECRET', ''),

  // RevenueCat
  revenuecatApiKey: required('REVENUECAT_API_KEY'),
  revenuecatWebhookSecret: optional('REVENUECAT_WEBHOOK_SECRET', ''),

  // Rate Limiting
  rateLimitWindowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  rateLimitMaxRequests: parseInt(optional('RATE_LIMIT_MAX_REQUESTS', '100'), 10),

  // Cron
  cronEnabled: optional('CRON_ENABLED', 'true') === 'true',
  cronIntervalMinutes: parseInt(optional('CRON_INTERVAL_MINUTES', '30'), 10),

  // Logging
  logLevel: optional('LOG_LEVEL', 'info'),

  // Cache TTLs (seconds)
  cacheTtlTrends: parseInt(optional('CACHE_TTL_TRENDS', '900'), 10),
  cacheTtlScores: parseInt(optional('CACHE_TTL_SCORES', '1800'), 10),
};
