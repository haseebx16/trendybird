/**
 * TrendScore model — Supabase queries for trend_scores table.
 */
const { supabaseAdmin } = require('../config/supabase');
const logger = require('../config/logger');
const { todayDateString } = require('../utils/helpers');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../utils/constants');

const TrendScoreModel = {
  /**
   * Upsert a trend score (one per keyword/country/date).
   */
  async upsert(score) {
    const { data, error } = await supabaseAdmin
      .from('trend_scores')
      .upsert(
        {
          keyword_normalized: score.keyword_normalized,
          country_code: score.country_code,
          category_slug: score.category_slug || null,
          momentum_score: score.momentum_score,
          velocity_score: score.velocity_score || 0,
          freshness_score: score.freshness_score || 0,
          cross_platform_score: score.cross_platform_score || 0,
          volume_score: score.volume_score || 0,
          sources_detected: score.sources_detected || [],
          source_count: score.source_count || 1,
          peak_volume: score.peak_volume || 0,
          avg_growth_pct: score.avg_growth_pct || 0,
          scored_at: new Date().toISOString(),
          score_date: score.score_date || todayDateString(),
        },
        {
          onConflict: 'keyword_normalized,country_code,score_date',
        }
      )
      .select();

    if (error) {
      logger.error('Failed to upsert trend score', { error: error.message });
      throw error;
    }
    return data?.[0];
  },

  /**
   * Bulk upsert scores.
   */
  async bulkUpsert(scores) {
    if (!scores.length) return [];

    const records = scores.map((s) => ({
      keyword_normalized: s.keyword_normalized,
      country_code: s.country_code,
      category_slug: s.category_slug || null,
      momentum_score: s.momentum_score,
      velocity_score: s.velocity_score || 0,
      freshness_score: s.freshness_score || 0,
      cross_platform_score: s.cross_platform_score || 0,
      volume_score: s.volume_score || 0,
      sources_detected: s.sources_detected || [],
      source_count: s.source_count || 1,
      peak_volume: s.peak_volume || 0,
      avg_growth_pct: s.avg_growth_pct || 0,
      scored_at: new Date().toISOString(),
      score_date: s.score_date || todayDateString(),
    }));

    const { data, error } = await supabaseAdmin
      .from('trend_scores')
      .upsert(records, {
        onConflict: 'keyword_normalized,country_code,score_date',
      })
      .select();

    if (error) {
      logger.error('Failed to bulk upsert scores', { error: error.message });
      throw error;
    }
    return data;
  },

  /**
   * Get top trending scores for a country with filters + pagination.
   * This is the primary endpoint query.
   */
  async getTopScores({
    countryCode = 'US',
    category = 'all',
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    minScore = 0,
    sort = 'momentum_score',
    order = 'desc',
  }) {
    const pageSize = Math.min(limit, MAX_PAGE_SIZE);
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from('trend_scores')
      .select('*', { count: 'exact' })
      .eq('country_code', countryCode)
      .eq('score_date', todayDateString())
      .gte('momentum_score', minScore)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + pageSize - 1);

    // Filter by category (skip if 'all')
    if (category && category !== 'all') {
      query = query.eq('category_slug', category);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch top scores', { error: error.message });
      throw error;
    }

    return {
      data,
      pagination: {
        page,
        limit: pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  },

  /**
   * Get score detail for a single trend.
   */
  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from('trend_scores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Search scores by keyword.
   */
  async search({ query, countryCode = 'US', limit = 20 }) {
    const { data, error } = await supabaseAdmin
      .from('trend_scores')
      .select('*')
      .eq('country_code', countryCode)
      .eq('score_date', todayDateString())
      .ilike('keyword_normalized', `%${query}%`)
      .order('momentum_score', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to search scores', { error: error.message });
      throw error;
    }
    return data;
  },

  /**
   * Delete scores older than N days.
   */
  async deleteOlderThan(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const { error } = await supabaseAdmin
      .from('trend_scores')
      .delete()
      .lt('score_date', cutoffStr);

    if (error) {
      logger.error('Failed to delete old scores', { error: error.message });
      throw error;
    }
  },
};

module.exports = TrendScoreModel;
