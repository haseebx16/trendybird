/**
 * Trends routes — all require auth + active subscription.
 * 
 * GET /api/trends              — Top trending (paginated, filterable)
 * GET /api/trends/search       — Search trends by keyword
 * GET /api/trends/:id          — Single trend detail
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireSubscription } = require('../middleware/subscription');
const { validate, schemas } = require('../middleware/validate');
const { cache, cacheKeys } = require('../config/cache');
const TrendScoreModel = require('../models/trendScore');
const env = require('../config/env');

// All trend routes require auth + subscription (hard paywall)
router.use(authenticate);
router.use(requireSubscription);

/**
 * GET /api/trends
 * Fetch top trending keywords with pagination and filters.
 */
router.get('/', validate(schemas.getTrends, 'query'), async (req, res, next) => {
  try {
    const { country, category, page, limit, min_score, sort, order } = req.query;

    // Check cache
    const cacheKey = cacheKeys.trends(country, category, page);
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, ...cached, cached: true });
    }

    // Query database
    const result = await TrendScoreModel.getTopScores({
      countryCode: country,
      category,
      page,
      limit,
      minScore: min_score,
      sort,
      order,
    });

    // Format response
    const response = {
      trends: result.data.map(formatTrendResponse),
      pagination: result.pagination,
    };

    // Cache for 15 min
    cache.set(cacheKey, response, env.cacheTtlTrends);

    res.json({ success: true, ...response });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/trends/search?q=keyword
 * Search trends by keyword.
 */
router.get('/search', validate(schemas.searchTrends, 'query'), async (req, res, next) => {
  try {
    const { q, country, limit } = req.query;

    const results = await TrendScoreModel.search({
      query: q,
      countryCode: country,
      limit,
    });

    res.json({
      success: true,
      query: q,
      trends: results.map(formatTrendResponse),
      count: results.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/trends/:id
 * Get detailed score breakdown for a single trend.
 */
router.get('/:id', validate(schemas.getTrendById, 'params'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check cache
    const cacheKey = cacheKeys.trendDetail(id);
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, trend: cached, cached: true });
    }

    const trend = await TrendScoreModel.getById(id);

    if (!trend) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Trend not found.',
      });
    }

    const formatted = formatTrendResponse(trend);

    // Cache for 30 min
    cache.set(cacheKey, formatted, env.cacheTtlScores);

    res.json({ success: true, trend: formatted });
  } catch (err) {
    next(err);
  }
});

/**
 * Format a trend score record for API response.
 * Never expose internal IDs or raw DB fields directly.
 */
function formatTrendResponse(score) {
  return {
    id: score.id,
    keyword: score.keyword_normalized,
    country: score.country_code,
    category: score.category_slug,
    momentum_score: parseFloat(score.momentum_score),
    scores: {
      velocity: parseFloat(score.velocity_score),
      freshness: parseFloat(score.freshness_score),
      cross_platform: parseFloat(score.cross_platform_score),
      volume: parseFloat(score.volume_score),
    },
    sources: score.sources_detected,
    source_count: score.source_count,
    peak_volume: score.peak_volume,
    avg_growth_pct: parseFloat(score.avg_growth_pct),
    scored_at: score.scored_at,
    score_date: score.score_date,
  };
}

module.exports = router;
