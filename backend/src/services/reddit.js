/**
 * Reddit public API service (optional data source).
 * Fetches top/rising posts from popular subreddits.
 * 
 * Uses Reddit's public JSON API (no auth needed for read-only).
 * Falls back to authenticated API if credentials are provided.
 */
const axios = require('axios');
const env = require('../config/env');
const logger = require('../config/logger');
const { normalizeKeyword, sleep } = require('../utils/helpers');
const { SOURCES, MAX_REDDIT_RESULTS } = require('../utils/constants');

const REDDIT_BASE = 'https://www.reddit.com';
const REDDIT_OAUTH_BASE = 'https://oauth.reddit.com';

// Subreddits to monitor by category
const SUBREDDIT_MAP = {
  tech: ['technology', 'programming', 'artificial', 'gadgets', 'startups'],
  entertainment: ['movies', 'television', 'music', 'popculture'],
  gaming: ['gaming', 'Games', 'pcgaming', 'PS5', 'XboxSeriesX'],
  sports: ['sports', 'nba', 'soccer', 'nfl'],
  fashion: ['fashion', 'malefashionadvice', 'femalefashionadvice', 'beauty'],
  food: ['food', 'cooking', 'foodhacks'],
  health: ['health', 'fitness', 'nutrition'],
  finance: ['wallstreetbets', 'CryptoCurrency', 'investing', 'personalfinance'],
  science: ['science', 'space', 'Futurology'],
  memes: ['memes', 'dankmemes', 'TikTokCringe'],
};

let oauthToken = null;
let tokenExpiresAt = 0;

const RedditService = {
  /**
   * Fetch rising/hot posts from a set of subreddits for a category.
   */
  async fetchTrendingPosts(category = 'all', countryCode = 'GLOBAL') {
    try {
      const subreddits = category === 'all'
        ? ['popular', 'all']
        : SUBREDDIT_MAP[category] || ['popular'];

      const allTrends = [];

      for (const sub of subreddits.slice(0, 3)) { // limit to 3 subs per category
        const posts = await fetchSubreddit(sub, 'hot');
        
        for (let i = 0; i < Math.min(posts.length, MAX_REDDIT_RESULTS); i++) {
          const post = posts[i];
          const keyword = post.data?.title || '';
          if (!keyword) continue;

          allTrends.push({
            keyword,
            keyword_normalized: normalizeKeyword(keyword),
            source: SOURCES.REDDIT,
            country_code: countryCode,
            category_slug: category !== 'all' ? category : null,
            source_volume: post.data?.score || 0,
            source_growth_pct: null,
            source_rank: i + 1,
            source_metadata: {
              subreddit: post.data?.subreddit,
              permalink: post.data?.permalink,
              num_comments: post.data?.num_comments || 0,
              upvote_ratio: post.data?.upvote_ratio || 0,
              created_utc: post.data?.created_utc,
              is_video: post.data?.is_video || false,
              thumbnail: post.data?.thumbnail,
              url: post.data?.url,
            },
          });
        }

        // Respect Reddit rate limits (1 req/sec for unauthenticated)
        await sleep(1200);
      }

      logger.info(`Reddit: fetched ${allTrends.length} trending posts`, { category });
      return allTrends;
    } catch (err) {
      logger.error('Reddit fetch failed', { category, error: err.message });
      return [];
    }
  },

  /**
   * Check if Reddit integration is configured.
   */
  isConfigured() {
    return Boolean(env.redditClientId && env.redditClientSecret);
  },
};

/**
 * Fetch posts from a subreddit (public JSON API).
 */
async function fetchSubreddit(subreddit, sort = 'hot', limit = 25) {
  try {
    const url = `${REDDIT_BASE}/r/${subreddit}/${sort}.json`;
    const response = await axios.get(url, {
      params: { limit, raw_json: 1 },
      headers: {
        'User-Agent': 'TrendyBird/1.0 (trend detection service)',
      },
      timeout: 10000,
    });

    return response.data?.data?.children || [];
  } catch (err) {
    logger.error('Reddit subreddit fetch failed', { subreddit, error: err.message });
    return [];
  }
}

module.exports = RedditService;
