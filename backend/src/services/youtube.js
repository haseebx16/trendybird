/**
 * YouTube Data API v3 service.
 * Fetches most popular videos per region to detect trending topics.
 * 
 * Uses the official YouTube Data API — requires API key.
 * Free quota: 10,000 units/day. mostPopular list costs 1 unit.
 */
const axios = require('axios');
const env = require('../config/env');
const logger = require('../config/logger');
const { normalizeKeyword, sleep } = require('../utils/helpers');
const { SOURCES, MAX_YOUTUBE_RESULTS } = require('../utils/constants');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

const YouTubeService = {
  /**
   * Fetch most popular (trending) videos for a region.
   * Extracts keywords from video titles & tags.
   */
  async fetchTrendingVideos(countryCode) {
    try {
      // YouTube uses ISO 3166-1 alpha-2 for regionCode
      const regionCode = countryCode === 'GLOBAL' ? 'US' : countryCode;

      const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          regionCode,
          maxResults: MAX_YOUTUBE_RESULTS,
          key: env.youtubeApiKey,
        },
        timeout: 10000,
      });

      const videos = response.data?.items || [];
      const trends = [];

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const snippet = video.snippet || {};
        const stats = video.statistics || {};

        // Use video title as the primary keyword
        const keyword = snippet.title || '';
        if (!keyword) continue;

        // Extract category from YouTube's category ID
        const categorySlug = mapYouTubeCategory(snippet.categoryId);

        trends.push({
          keyword,
          keyword_normalized: normalizeKeyword(keyword),
          source: SOURCES.YOUTUBE,
          country_code: countryCode,
          category_slug: categorySlug,
          source_volume: parseInt(stats.viewCount, 10) || 0,
          source_growth_pct: null, // would need historical data to compute
          source_rank: i + 1,
          source_metadata: {
            video_id: video.id,
            channel_title: snippet.channelTitle,
            channel_id: snippet.channelId,
            published_at: snippet.publishedAt,
            thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
            view_count: parseInt(stats.viewCount, 10) || 0,
            like_count: parseInt(stats.likeCount, 10) || 0,
            comment_count: parseInt(stats.commentCount, 10) || 0,
            tags: (snippet.tags || []).slice(0, 10),
            youtube_category_id: snippet.categoryId,
          },
        });
      }

      logger.info(`YouTube: fetched ${trends.length} trending videos`, { countryCode });
      return trends;
    } catch (err) {
      // Handle quota exceeded gracefully
      if (err.response?.status === 403) {
        logger.warn('YouTube API quota exceeded or forbidden', {
          countryCode,
          status: err.response.status,
        });
      } else {
        logger.error('YouTube trending fetch failed', {
          countryCode,
          error: err.message,
        });
      }
      return [];
    }
  },

  /**
   * Fetch trending videos across multiple categories for a region.
   * Costs more quota but gives category-specific trends.
   */
  async fetchTrendingByCategory(countryCode, videoCategoryId) {
    try {
      const regionCode = countryCode === 'GLOBAL' ? 'US' : countryCode;

      const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          regionCode,
          videoCategoryId,
          maxResults: 10,
          key: env.youtubeApiKey,
        },
        timeout: 10000,
      });

      return response.data?.items || [];
    } catch (err) {
      logger.error('YouTube category fetch failed', {
        countryCode,
        videoCategoryId,
        error: err.message,
      });
      return [];
    }
  },
};

/**
 * Map YouTube category IDs to our category slugs.
 * https://developers.google.com/youtube/v3/docs/videoCategories
 */
function mapYouTubeCategory(categoryId) {
  const map = {
    '1': 'entertainment',   // Film & Animation
    '2': 'entertainment',   // Autos & Vehicles
    '10': 'entertainment',  // Music
    '15': 'entertainment',  // Pets & Animals
    '17': 'sports',         // Sports
    '18': 'entertainment',  // Short Movies
    '19': 'travel',         // Travel & Events
    '20': 'gaming',         // Gaming
    '22': 'entertainment',  // People & Blogs
    '23': 'entertainment',  // Comedy
    '24': 'entertainment',  // Entertainment
    '25': 'politics',       // News & Politics
    '26': 'fashion',        // Howto & Style
    '27': 'education',      // Education
    '28': 'tech',           // Science & Technology
    '29': 'entertainment',  // Nonprofits & Activism
    '30': 'entertainment',  // Movies
    '35': 'entertainment',  // Documentary
    '36': 'entertainment',  // Drama
    '37': 'entertainment',  // Family
    '38': 'entertainment',  // Foreign
    '39': 'entertainment',  // Horror
    '40': 'science',        // Sci-Fi/Fantasy
    '41': 'entertainment',  // Thriller
    '42': 'entertainment',  // Shorts
    '43': 'entertainment',  // Shows
    '44': 'entertainment',  // Trailers
  };
  return map[categoryId] || null;
}

module.exports = YouTubeService;
