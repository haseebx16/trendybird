/**
 * Google Trends data fetching service.
 * Uses google-trends-api package (legal — scrapes public Google Trends page).
 * 
 * Fetches:
 * - Daily trending searches per country
 * - Real-time trending searches
 * - Interest over time for velocity tracking
 */
const googleTrends = require('google-trends-api');
const logger = require('../config/logger');
const { normalizeKeyword, sleep } = require('../utils/helpers');
const { SOURCES, MAX_TRENDS_PER_FETCH } = require('../utils/constants');

const GoogleTrendsService = {
  /**
   * Fetch daily trending searches for a country.
   * Returns normalized trend objects ready for DB insertion.
   */
  async fetchDailyTrends(countryCode) {
    try {
      // Google Trends uses geo codes (US, GB, etc.)
      const geo = countryCode === 'GLOBAL' ? '' : countryCode;

      const result = await googleTrends.dailyTrends({
        trendDate: new Date(),
        geo,
      });

      const parsed = JSON.parse(result);
      const days = parsed?.default?.trendingSearchesDays || [];

      const trends = [];

      for (const day of days) {
        const searches = day.trendingSearches || [];

        for (let i = 0; i < Math.min(searches.length, MAX_TRENDS_PER_FETCH); i++) {
          const search = searches[i];
          const keyword = search.title?.query || '';
          if (!keyword) continue;

          // Extract traffic volume (e.g., "200K+" → 200000)
          const trafficStr = search.formattedTraffic || '0';
          const volume = parseTrafficVolume(trafficStr);

          // Extract related topics for category inference
          const relatedQueries = (search.relatedQueries || [])
            .map((q) => q.query)
            .slice(0, 5);

          trends.push({
            keyword,
            keyword_normalized: normalizeKeyword(keyword),
            source: SOURCES.GOOGLE_TRENDS,
            country_code: countryCode,
            category_slug: null, // will be inferred by categorizer
            source_volume: volume,
            source_growth_pct: null, // daily trends don't give % directly
            source_rank: i + 1,
            source_metadata: {
              formatted_traffic: trafficStr,
              related_queries: relatedQueries,
              image: search.image?.newsUrl || null,
              articles: (search.articles || []).slice(0, 3).map((a) => ({
                title: a.title,
                url: a.url,
                source: a.source,
              })),
            },
          });
        }
      }

      logger.info(`Google Trends: fetched ${trends.length} daily trends`, { countryCode });
      return trends;
    } catch (err) {
      logger.error('Google Trends daily fetch failed', {
        countryCode,
        error: err.message,
      });
      return [];
    }
  },

  /**
   * Fetch real-time trending searches (more granular, updates hourly).
   */
  async fetchRealTimeTrends(countryCode, category = 'all') {
    try {
      const geo = countryCode === 'GLOBAL' ? '' : countryCode;

      // Category mapping for Google Trends
      const categoryMap = {
        all: 'all',
        tech: 't',
        entertainment: 'e',
        sports: 's',
        health: 'm',
        finance: 'b',
        science: 'p',
      };

      const result = await googleTrends.realTimeTrends({
        geo,
        category: categoryMap[category] || 'all',
      });

      const parsed = JSON.parse(result);
      const stories = parsed?.storySummaries?.trendingStories || [];

      const trends = [];

      for (let i = 0; i < Math.min(stories.length, MAX_TRENDS_PER_FETCH); i++) {
        const story = stories[i];
        const keyword = story.title || story.entityNames?.[0] || '';
        if (!keyword) continue;

        trends.push({
          keyword,
          keyword_normalized: normalizeKeyword(keyword),
          source: SOURCES.GOOGLE_TRENDS,
          country_code: countryCode,
          category_slug: category !== 'all' ? category : null,
          source_volume: null,
          source_growth_pct: null,
          source_rank: i + 1,
          source_metadata: {
            entity_names: story.entityNames || [],
            articles_count: story.articles?.length || 0,
          },
        });
      }

      logger.info(`Google Trends: fetched ${trends.length} real-time trends`, { countryCode, category });
      return trends;
    } catch (err) {
      logger.error('Google Trends real-time fetch failed', {
        countryCode,
        error: err.message,
      });
      return [];
    }
  },

  /**
   * Get interest over time for a keyword (for velocity calculation).
   * Returns array of { time, value } data points.
   */
  async fetchInterestOverTime(keyword, countryCode, timeRange = 'now 7-d') {
    try {
      const geo = countryCode === 'GLOBAL' ? '' : countryCode;

      const result = await googleTrends.interestOverTime({
        keyword,
        geo,
        startTime: getStartTime(timeRange),
      });

      const parsed = JSON.parse(result);
      const timeline = parsed?.default?.timelineData || [];

      return timeline.map((point) => ({
        time: new Date(parseInt(point.time) * 1000).toISOString(),
        value: point.value?.[0] || 0,
      }));
    } catch (err) {
      logger.error('Google Trends interest-over-time failed', {
        keyword,
        error: err.message,
      });
      return [];
    }
  },
};

// ============================================
// Helper functions
// ============================================

/**
 * Parse Google's formatted traffic string to a number.
 * "200K+" → 200000, "2M+" → 2000000
 */
function parseTrafficVolume(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[+,]/g, '').trim();
  const multipliers = { K: 1000, M: 1000000, B: 1000000000 };

  for (const [suffix, mult] of Object.entries(multipliers)) {
    if (cleaned.toUpperCase().endsWith(suffix)) {
      return Math.round(parseFloat(cleaned) * mult);
    }
  }
  return parseInt(cleaned, 10) || 0;
}

/**
 * Convert time range string to start Date.
 */
function getStartTime(timeRange) {
  const now = new Date();
  switch (timeRange) {
    case 'now 1-H': return new Date(now.getTime() - 60 * 60 * 1000);
    case 'now 4-H': return new Date(now.getTime() - 4 * 60 * 60 * 1000);
    case 'now 1-d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'now 7-d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

module.exports = GoogleTrendsService;
