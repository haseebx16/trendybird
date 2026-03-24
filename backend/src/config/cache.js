/**
 * In-memory cache using node-cache.
 * Used to reduce Supabase reads and external API calls on free tier.
 * 
 * Strategy:
 * - Trend lists: 15 min TTL (fresh enough for 30-min cron)
 * - Score data: 30 min TTL (scores only update on cron runs)
 * - Country/category lists: 1 hour TTL (rarely change)
 */
const NodeCache = require('node-cache');
const env = require('./env');

const cache = new NodeCache({
  stdTTL: env.cacheTtlTrends,   // default 15 min
  checkperiod: 120,              // check for expired keys every 2 min
  useClones: false,              // return references (faster, safe for read-only)
  maxKeys: 5000,                 // prevent memory bloat on free tier
});

// Cache key generators for consistency
const cacheKeys = {
  trends: (country, category, page) => `trends:${country}:${category}:${page}`,
  trendDetail: (id) => `trend:${id}`,
  trendScores: (country, category) => `scores:${country}:${category}`,
  countries: () => 'countries:all',
  categories: () => 'categories:all',
  userSubscription: (userId) => `sub:${userId}`,
};

module.exports = { cache, cacheKeys };
