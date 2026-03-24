/**
 * Cron scheduler — manages all scheduled jobs.
 * 
 * Jobs:
 * - fetchAndScoreTrends: every 30 minutes (configurable)
 * - cleanupStaleData: once daily at 3 AM UTC
 */
const cron = require('node-cron');
const env = require('../config/env');
const logger = require('../config/logger');
const { fetchAndScoreTrends } = require('./fetchTrends');
const { cleanupStaleData } = require('./cleanup');

let trendJob = null;
let cleanupJob = null;

function startScheduler() {
  if (!env.cronEnabled) {
    logger.info('Cron jobs disabled (CRON_ENABLED=false)');
    return;
  }

  // Trend fetching — every N minutes
  const intervalMinutes = env.cronIntervalMinutes;
  const trendCron = `*/${intervalMinutes} * * * *`;

  trendJob = cron.schedule(trendCron, async () => {
    logger.info('⏰ Scheduled: fetchAndScoreTrends');
    await fetchAndScoreTrends();
  }, {
    scheduled: true,
    timezone: 'UTC',
  });

  // Cleanup — daily at 3:00 AM UTC
  cleanupJob = cron.schedule('0 3 * * *', async () => {
    logger.info('⏰ Scheduled: cleanupStaleData');
    await cleanupStaleData();
  }, {
    scheduled: true,
    timezone: 'UTC',
  });

  logger.info(`✅ Cron scheduler started`, {
    trendInterval: `every ${intervalMinutes} minutes`,
    cleanup: 'daily at 3:00 AM UTC',
  });

  // Run initial fetch on startup (after a short delay to let server settle)
  setTimeout(async () => {
    logger.info('Running initial trend fetch on startup...');
    await fetchAndScoreTrends();
  }, 10000);
}

function stopScheduler() {
  if (trendJob) trendJob.stop();
  if (cleanupJob) cleanupJob.stop();
  logger.info('Cron scheduler stopped');
}

module.exports = { startScheduler, stopScheduler };
