/**
 * Trend model — Supabase queries for trends table.
 */
const { supabaseAdmin } = require('../config/supabase');
const logger = require('../config/logger');
const { todayDateString } = require('../utils/helpers');

const TrendModel = {
  /**
   * Upsert a trend record (insert or update on conflict).
   * Uses the unique index: (keyword_normalized, source, country_code, trend_date)
   */
  async upsert(trend) {
    const { data, error } = await supabaseAdmin
      .from('trends')
      .upsert(
        {
          keyword: trend.keyword,
          keyword_normalized: trend.keyword_normalized,
          source: trend.source,
          country_code: trend.country_code,
          category_slug: trend.category_slug || null,
          source_volume: trend.source_volume || null,
          source_growth_pct: trend.source_growth_pct || null,
          source_rank: trend.source_rank || null,
          source_metadata: trend.source_metadata || {},
          fetched_at: new Date().toISOString(),
          trend_date: trend.trend_date || todayDateString(),
        },
        {
          onConflict: 'keyword_normalized,source,country_code,trend_date',
        }
      )
      .select();

    if (error) {
      logger.error('Failed to upsert trend', {
        keyword: trend.keyword,
        error: error.message,
      });
      throw error;
    }
    return data?.[0];
  },

  /**
   * Bulk upsert trends.
   */
  async bulkUpsert(trends) {
    if (!trends.length) return [];

    const records = trends.map((t) => ({
      keyword: t.keyword,
      keyword_normalized: t.keyword_normalized,
      source: t.source,
      country_code: t.country_code,
      category_slug: t.category_slug || null,
      source_volume: t.source_volume || null,
      source_growth_pct: t.source_growth_pct || null,
      source_rank: t.source_rank || null,
      source_metadata: t.source_metadata || {},
      fetched_at: new Date().toISOString(),
      trend_date: t.trend_date || todayDateString(),
    }));

    const { data, error } = await supabaseAdmin
      .from('trends')
      .upsert(records, {
        onConflict: 'keyword_normalized,source,country_code,trend_date',
      })
      .select();

    if (error) {
      logger.error('Failed to bulk upsert trends', { error: error.message });
      throw error;
    }
    return data;
  },

  /**
   * Get trends by country + date.
   */
  async getByCountry(countryCode, date = todayDateString()) {
    const { data, error } = await supabaseAdmin
      .from('trends')
      .select('*')
      .eq('country_code', countryCode)
      .eq('trend_date', date)
      .order('source_rank', { ascending: true });

    if (error) {
      logger.error('Failed to fetch trends by country', { error: error.message });
      throw error;
    }
    return data;
  },

  /**
   * Get all trends for today (used by scorer to compute scores).
   */
  async getTodayTrends(countryCode) {
    const { data, error } = await supabaseAdmin
      .from('trends')
      .select('*')
      .eq('country_code', countryCode)
      .eq('trend_date', todayDateString());

    if (error) {
      logger.error('Failed to fetch today trends', { error: error.message });
      throw error;
    }
    return data;
  },

  /**
   * Delete trends older than N days (cleanup job).
   */
  async deleteOlderThan(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const { error, count } = await supabaseAdmin
      .from('trends')
      .delete()
      .lt('trend_date', cutoffStr);

    if (error) {
      logger.error('Failed to delete old trends', { error: error.message });
      throw error;
    }
    return count;
  },
};

module.exports = TrendModel;
