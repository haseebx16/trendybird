/**
 * Main cron job: Fetch trends from all sources, normalize, score, and store.
 * 
 * Runs every 30 minutes. Designed for free-tier constraints:
 * - Rotates through country batches (not all at once)
 * - Respects API rate limits with delays between calls
 * - Fails gracefully per-source (doesn't stop if one source errors)
 */
const GoogleTrendsService = require('../services/googleTrends');
const YouTubeService = require('../services/youtube');
const RedditService = require('../services/reddit');
const NormalizerService = require('../services/normalizer');
const TrendScorer = require('../services/trendScorer');
const TrendModel = require('../models/trend');
const TrendScoreModel = require('../models/trendScore');
const TrendSnapshotModel = require('../models/trendSnapshot');
const CountryModel = require('../models/country');
const { cache } = require('../config/cache');
const logger = require('../config/logger');
const { sleep, chunk } = require('../utils/helpers');
const { CRON_BATCH_SIZE } = require('../utils/constants');

// Track which batch of countries we're on (persists across cron runs in memory)
let currentBatchIndex = 0;

/**
 * Main fetch-and-score pipeline.
 */
async function fetchAndScoreTrends() {
  const startTime = Date.now();
  logger.info('🔄 Cron job started: fetchAndScoreTrends');

  try {
    // 1. Get the next batch of countries to process
    const allCountryCodes = await CountryModel.getActiveCodes();
    const batches = chunk(allCountryCodes, CRON_BATCH_SIZE);
    
    if (batches.length === 0) {
      logger.warn('No active countries found');
      return;
    }

    // Rotate through batches across cron runs
    const batchIndex = currentBatchIndex % batches.length;
    const countriesToProcess = batches[batchIndex];
    currentBatchIndex++;

    logger.info(`Processing country batch ${batchIndex + 1}/${batches.length}`, {
      countries: countriesToProcess,
    });

    // 2. Fetch trends for each country in this batch
    for (const countryCode of countriesToProcess) {
      try {
        await processCountry(countryCode);
      } catch (err) {
        logger.error(`Failed to process country: ${countryCode}`, { error: err.message });
        // Continue to next country
      }

      // Delay between countries to respect rate limits
      await sleep(2000);
    }

    // 3. Clear stale cache entries
    cache.flushAll();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.info(`✅ Cron job completed in ${duration}s`, {
      countriesProcessed: countriesToProcess.length,
    });
  } catch (err) {
    logger.error('Cron job failed', { error: err.message, stack: err.stack });
  }
}

/**
 * Process a single country: fetch from all sources, normalize, score, store.
 */
async function processCountry(countryCode) {
  logger.info(`Processing trends for ${countryCode}`);

  // 1. Fetch from all sources in parallel (fail independently)
  const [googleTrends, youtubeTrends, redditTrends] = await Promise.allSettled([
    GoogleTrendsService.fetchDailyTrends(countryCode),
    YouTubeService.fetchTrendingVideos(countryCode),
    RedditService.isConfigured()
      ? RedditService.fetchTrendingPosts('all', countryCode)
      : Promise.resolve([]),
  ]);

  // Collect all successful results
  const allTrends = [
    ...(googleTrends.status === 'fulfilled' ? googleTrends.value : []),
    ...(youtubeTrends.status === 'fulfilled' ? youtubeTrends.value : []),
    ...(redditTrends.status === 'fulfilled' ? redditTrends.value : []),
  ];

  if (allTrends.length === 0) {
    logger.warn(`No trends fetched for ${countryCode}`);
    return;
  }

  logger.info(`Fetched ${allTrends.length} raw trends for ${countryCode}`);

  // 2. Store raw trends in DB
  try {
    await TrendModel.bulkUpsert(allTrends);
  } catch (err) {
    logger.error('Failed to store raw trends', { countryCode, error: err.message });
  }

  // 3. Record snapshots for velocity tracking
  try {
    const snapshots = allTrends.map((t) => ({
      keyword_normalized: t.keyword_normalized,
      country_code: t.country_code,
      source: t.source,
      volume: t.source_volume || 0,
      growth_pct: t.source_growth_pct || 0,
    }));
    await TrendSnapshotModel.bulkInsert(snapshots);
  } catch (err) {
    logger.error('Failed to store snapshots', { countryCode, error: err.message });
  }

  // 4. Merge trends across sources (dedup by normalized keyword)
  const mergedTrends = NormalizerService.mergeTrends(allTrends);
  logger.info(`Merged to ${mergedTrends.length} unique keywords for ${countryCode}`);

  // 5. Score each merged trend
  const scores = await TrendScorer.scoreBatch(mergedTrends, { countryCode });

  // 6. Store scores in DB
  try {
    await TrendScoreModel.bulkUpsert(scores);
    logger.info(`Stored ${scores.length} trend scores for ${countryCode}`);
  } catch (err) {
    logger.error('Failed to store scores', { countryCode, error: err.message });
  }
}

module.exports = { fetchAndScoreTrends };
