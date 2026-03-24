/**
 * TrendSnapshot model — historical data points for velocity calculation.
 */
const { supabaseAdmin } = require('../config/supabase');
const logger = require('../config/logger');

const TrendSnapshotModel = {
  /**
   * Record a snapshot for a keyword (called during each cron run).
   */
  async insert(snapshot) {
    const { error } = await supabaseAdmin
      .from('trend_snapshots')
      .insert({
        keyword_normalized: snapshot.keyword_normalized,
        country_code: snapshot.country_code,
        source: snapshot.source,
        volume: snapshot.volume || 0,
        growth_pct: snapshot.growth_pct || 0,
        snapshot_at: new Date().toISOString(),
      });

    if (error) {
      logger.error('Failed to insert snapshot', { error: error.message });
    }
  },

  /**
   * Bulk insert snapshots.
   */
  async bulkInsert(snapshots) {
    if (!snapshots.length) return;

    const records = snapshots.map((s) => ({
      keyword_normalized: s.keyword_normalized,
      country_code: s.country_code,
      source: s.source,
      volume: s.volume || 0,
      growth_pct: s.growth_pct || 0,
      snapshot_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from('trend_snapshots')
      .insert(records);

    if (error) {
      logger.error('Failed to bulk insert snapshots', { error: error.message });
    }
  },

  /**
   * Get recent snapshots for a keyword (for velocity calculation).
   * Returns last N snapshots, ordered newest → oldest.
   */
  async getRecent(keywordNormalized, countryCode, hoursBack = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hoursBack);

    const { data, error } = await supabaseAdmin
      .from('trend_snapshots')
      .select('*')
      .eq('keyword_normalized', keywordNormalized)
      .eq('country_code', countryCode)
      .gte('snapshot_at', since.toISOString())
      .order('snapshot_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch recent snapshots', { error: error.message });
      return [];
    }
    return data;
  },

  /**
   * Delete snapshots older than N days (cleanup job).
   */
  async deleteOlderThan(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { error } = await supabaseAdmin
      .from('trend_snapshots')
      .delete()
      .lt('snapshot_at', cutoff.toISOString());

    if (error) {
      logger.error('Failed to delete old snapshots', { error: error.message });
    }
  },
};

module.exports = TrendSnapshotModel;
