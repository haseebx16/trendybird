/**
 * Cleanup job — removes stale data to keep DB lean on free tier.
 * 
 * Runs daily. Removes:
 * - Trends older than 7 days
 * - Scores older than 7 days
 * - Snapshots older than 3 days (only needed for velocity calc)
 */
const TrendModel = require('../models/trend');
const TrendScoreModel = require('../models/trendScore');
const TrendSnapshotModel = require('../models/trendSnapshot');
const logger = require('../config/logger');

async function cleanupStaleData() {
  logger.info('🧹 Cleanup job started');

  try {
    // Delete old trends (keep 7 days)
    await TrendModel.deleteOlderThan(7);
    logger.info('Cleaned up trends older than 7 days');

    // Delete old scores (keep 7 days)
    await TrendScoreModel.deleteOlderThan(7);
    logger.info('Cleaned up scores older than 7 days');

    // Delete old snapshots (keep 3 days — only needed for velocity calc)
    await TrendSnapshotModel.deleteOlderThan(3);
    logger.info('Cleaned up snapshots older than 3 days');

    logger.info('✅ Cleanup job completed');
  } catch (err) {
    logger.error('Cleanup job failed', { error: err.message });
  }
}

module.exports = { cleanupStaleData };
