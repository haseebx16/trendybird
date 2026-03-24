/**
 * Trend Momentum Engine — The core scoring algorithm.
 * 
 * Produces a 0–100 Momentum Score for each keyword based on:
 * 
 * 1. VELOCITY (35%) — How fast is it growing?
 *    - Compares current volume to historical snapshots
 *    - Higher weight for steeper growth curves
 *    - Penalizes flat or declining trends
 * 
 * 2. FRESHNESS (25%) — Is it new or saturated?
 *    - New keywords (first seen recently) get a boost
 *    - Keywords trending for days get diminishing returns
 *    - Prevents "old news" from scoring high
 * 
 * 3. CROSS-PLATFORM (25%) — Is it on multiple platforms?
 *    - Trending on 1 source = baseline
 *    - Trending on 2 sources = strong signal
 *    - Trending on 3 sources = very strong signal
 *    - Cross-platform validation = higher confidence
 * 
 * 4. VOLUME (15%) — Raw popularity signal
 *    - Logarithmic scale (prevents mega-trends from dominating)
 *    - Normalized against country-specific baselines
 *    - Lower weight because volume alone ≠ emerging trend
 * 
 * Design: Extensible for future AI/ML integration.
 * Each component returns 0–100, then weighted sum produces final score.
 */
const TrendSnapshotModel = require('../models/trendSnapshot');
const logger = require('../config/logger');
const { clamp, percentChange } = require('../utils/helpers');
const { SCORE_WEIGHTS } = require('../utils/constants');

const TrendScorer = {
  /**
   * Score a single merged trend object.
   * 
   * @param {Object} trend - Merged trend from NormalizerService
   * @param {Object} context - Additional context (country, historical data)
   * @returns {Object} Score breakdown + final momentum_score
   */
  async scoreTrend(trend, context = {}) {
    try {
      const [velocity, freshness, crossPlatform, volume] = await Promise.all([
        this.calculateVelocity(trend, context),
        this.calculateFreshness(trend, context),
        this.calculateCrossPlatform(trend),
        this.calculateVolume(trend, context),
      ]);

      // Weighted sum
      const momentumScore = clamp(
        Math.round(
          velocity * SCORE_WEIGHTS.VELOCITY +
          freshness * SCORE_WEIGHTS.FRESHNESS +
          crossPlatform * SCORE_WEIGHTS.CROSS_PLATFORM +
          volume * SCORE_WEIGHTS.VOLUME
        ),
        0,
        100
      );

      return {
        keyword_normalized: trend.keyword_normalized,
        country_code: trend.country_code,
        category_slug: trend.category_slug,
        momentum_score: momentumScore,
        velocity_score: Math.round(velocity),
        freshness_score: Math.round(freshness),
        cross_platform_score: Math.round(crossPlatform),
        volume_score: Math.round(volume),
        sources_detected: trend.sources,
        source_count: trend.sources.length,
        peak_volume: trend.peak_volume || 0,
        avg_growth_pct: trend.growth_pcts.length > 0
          ? trend.growth_pcts.reduce((a, b) => a + b, 0) / trend.growth_pcts.length
          : 0,
      };
    } catch (err) {
      logger.error('Failed to score trend', {
        keyword: trend.keyword_normalized,
        error: err.message,
      });
      // Return a minimal score on error rather than crashing
      return {
        keyword_normalized: trend.keyword_normalized,
        country_code: trend.country_code,
        category_slug: trend.category_slug,
        momentum_score: 0,
        velocity_score: 0,
        freshness_score: 0,
        cross_platform_score: 0,
        volume_score: 0,
        sources_detected: trend.sources || [],
        source_count: trend.sources?.length || 0,
        peak_volume: 0,
        avg_growth_pct: 0,
      };
    }
  },

  /**
   * Score a batch of merged trends.
   */
  async scoreBatch(mergedTrends, context = {}) {
    const scores = [];

    for (const trend of mergedTrends) {
      const score = await this.scoreTrend(trend, context);
      scores.push(score);
    }

    // Sort by momentum_score descending
    scores.sort((a, b) => b.momentum_score - a.momentum_score);

    return scores;
  },

  // ============================================
  // COMPONENT CALCULATORS (each returns 0–100)
  // ============================================

  /**
   * VELOCITY — measures growth acceleration.
   * Compares current volume/rank to recent historical snapshots.
   */
  async calculateVelocity(trend, context = {}) {
    try {
      // Get historical snapshots for this keyword (last 24 hours)
      const snapshots = await TrendSnapshotModel.getRecent(
        trend.keyword_normalized,
        trend.country_code,
        24
      );

      if (snapshots.length === 0) {
        // First time seeing this trend — moderate velocity (it's new)
        return 60;
      }

      if (snapshots.length === 1) {
        // Only one prior snapshot — check if volume is growing
        const prevVolume = snapshots[0].volume || 0;
        const currentVolume = trend.peak_volume || 0;

        if (prevVolume === 0) return 55;
        const change = percentChange(prevVolume, currentVolume);
        return clamp(mapPercentToScore(change), 0, 100);
      }

      // Multiple snapshots — calculate growth rate (linear regression slope)
      const volumes = snapshots.map((s) => s.volume || 0).reverse(); // oldest → newest
      const currentVolume = trend.peak_volume || 0;
      volumes.push(currentVolume);

      const slope = calculateSlope(volumes);
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

      // Normalize slope relative to average volume
      const normalizedSlope = avgVolume > 0 ? (slope / avgVolume) * 100 : 0;

      return clamp(mapPercentToScore(normalizedSlope), 0, 100);
    } catch (err) {
      logger.error('Velocity calculation failed', { error: err.message });
      return 30; // default moderate-low velocity on error
    }
  },

  /**
   * FRESHNESS — inverse of saturation.
   * New trends score high, stale trends score low.
   */
  async calculateFreshness(trend, context = {}) {
    try {
      // Get snapshots to determine how long this keyword has been trending
      const snapshots = await TrendSnapshotModel.getRecent(
        trend.keyword_normalized,
        trend.country_code,
        72 // look back 3 days
      );

      if (snapshots.length === 0) {
        // Brand new — maximum freshness
        return 100;
      }

      // Find the oldest snapshot
      const oldestSnapshot = snapshots[snapshots.length - 1];
      const hoursOld = (Date.now() - new Date(oldestSnapshot.snapshot_at).getTime()) / (1000 * 60 * 60);

      // Freshness decay curve:
      // 0-2 hours: 100 (brand new)
      // 2-6 hours: 90-80 (still fresh)
      // 6-12 hours: 80-60 (getting established)
      // 12-24 hours: 60-40 (been around)
      // 24-48 hours: 40-20 (old news)
      // 48+ hours: 20-5 (stale)
      if (hoursOld <= 2) return 100;
      if (hoursOld <= 6) return clamp(100 - (hoursOld - 2) * 5, 80, 100);
      if (hoursOld <= 12) return clamp(80 - (hoursOld - 6) * 3.3, 60, 80);
      if (hoursOld <= 24) return clamp(60 - (hoursOld - 12) * 1.67, 40, 60);
      if (hoursOld <= 48) return clamp(40 - (hoursOld - 24) * 0.83, 20, 40);
      return clamp(20 - (hoursOld - 48) * 0.2, 5, 20);
    } catch (err) {
      logger.error('Freshness calculation failed', { error: err.message });
      return 50; // default mid freshness on error
    }
  },

  /**
   * CROSS-PLATFORM — multi-source validation.
   * More sources = higher confidence the trend is real.
   */
  async calculateCrossPlatform(trend) {
    const sourceCount = trend.sources?.length || 1;

    // Scoring curve:
    // 1 source: 30 (single-source, unconfirmed)
    // 2 sources: 75 (cross-validated)
    // 3+ sources: 100 (strong multi-platform signal)
    switch (sourceCount) {
      case 1: return 30;
      case 2: return 75;
      default: return 100;
    }
  },

  /**
   * VOLUME — raw popularity signal (logarithmic).
   * Uses log scale to prevent mega-trends from overwhelming emerging ones.
   */
  async calculateVolume(trend, context = {}) {
    const volume = trend.peak_volume || 0;

    if (volume === 0) {
      // No volume data — use rank as proxy
      const rank = trend.best_rank || 50;
      // Rank 1 = 90, Rank 10 = 50, Rank 25 = 25
      return clamp(Math.round(100 - (rank * 3)), 10, 90);
    }

    // Logarithmic scaling:
    // 100 views: ~20
    // 1K views: ~30
    // 10K views: ~40
    // 100K views: ~55
    // 1M views: ~70
    // 10M views: ~85
    // 100M views: ~100
    const logScore = (Math.log10(Math.max(volume, 1)) / 8) * 100;
    return clamp(Math.round(logScore), 5, 100);
  },
};

// ============================================
// Mathematical helpers
// ============================================

/**
 * Map a percentage change to a 0–100 velocity score.
 * Diminishing returns above 100% growth.
 */
function mapPercentToScore(pctChange) {
  if (pctChange <= -50) return 0;    // declining sharply
  if (pctChange <= 0) return 15;     // declining or flat
  if (pctChange <= 10) return 30;    // slight growth
  if (pctChange <= 25) return 45;    // moderate growth
  if (pctChange <= 50) return 60;    // strong growth
  if (pctChange <= 100) return 75;   // very strong growth
  if (pctChange <= 200) return 85;   // explosive growth
  if (pctChange <= 500) return 92;   // viral
  return 100;                         // parabolic
}

/**
 * Calculate the slope of a data series (simple linear regression).
 * Positive slope = growing, negative = declining.
 */
function calculateSlope(values) {
  const n = values.length;
  if (n < 2) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;

  return (n * sumXY - sumX * sumY) / denominator;
}

module.exports = TrendScorer;
