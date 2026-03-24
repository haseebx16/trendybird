/**
 * Keyword normalization & category inference service.
 * 
 * Responsibilities:
 * - Normalize keywords across sources for deduplication
 * - Infer category from keyword + metadata
 * - Merge duplicate trends from different sources
 */
const { normalizeKeyword } = require('../utils/helpers');
const logger = require('../config/logger');

// Keyword → category patterns (simple rule-based, extensible for ML later)
const CATEGORY_PATTERNS = {
  tech: [
    /\b(ai|artificial intelligence|machine learning|chatgpt|openai|gpt|llm|coding|programming|software|app|crypto|blockchain|nft|web3|startup|saas|api|cloud|cybersecurity|hack|data|algorithm|robot|automat|neural|gpu|chip|semiconductor)\b/i,
  ],
  gaming: [
    /\b(game|gaming|playstation|ps5|xbox|nintendo|switch|steam|esport|fortnite|minecraft|gta|call of duty|cod|apex|valorant|league of legends|lol|dota|twitch|streamer)\b/i,
  ],
  entertainment: [
    /\b(movie|film|tv show|series|netflix|disney|hbo|marvel|dc|actor|actress|celebrity|music|album|song|concert|tour|grammy|oscar|emmy|billboard|spotify|tiktok|viral|meme)\b/i,
  ],
  sports: [
    /\b(nba|nfl|mlb|nhl|soccer|football|basketball|baseball|tennis|golf|olympics|world cup|champion|playoff|draft|trade|injury|coach|stadium|espn|ufc|mma|boxing|f1|formula)\b/i,
  ],
  fashion: [
    /\b(fashion|style|outfit|clothing|brand|designer|makeup|beauty|skincare|cosmetic|vogue|runway|model|trend|aesthetic|luxury)\b/i,
  ],
  food: [
    /\b(recipe|cooking|restaurant|food|meal|diet|nutrition|chef|baking|kitchen|foodie|vegan|organic|snack|drink|coffee|wine|beer)\b/i,
  ],
  health: [
    /\b(health|medical|doctor|hospital|vaccine|covid|virus|disease|mental health|therapy|fitness|workout|exercise|wellness|supplement|drug|fda|cdc|who)\b/i,
  ],
  finance: [
    /\b(stock|market|invest|bitcoin|crypto|ethereum|trading|economy|inflation|fed|interest rate|bank|wall street|revenue|profit|ipo|earnings|dividend|forex)\b/i,
  ],
  politics: [
    /\b(president|congress|senate|election|vote|democrat|republican|policy|law|legislation|supreme court|government|political|biden|trump|parliament|minister|sanction)\b/i,
  ],
  science: [
    /\b(science|research|study|nasa|space|mars|moon|climate|environment|physics|chemistry|biology|discovery|experiment|telescope|quantum|genome|fossil)\b/i,
  ],
  travel: [
    /\b(travel|trip|flight|hotel|vacation|tourism|destination|airline|airport|cruise|backpack|resort|beach|mountain|adventure)\b/i,
  ],
  education: [
    /\b(education|school|university|college|student|teacher|course|learn|tutorial|degree|scholarship|exam|certification|online class|mooc)\b/i,
  ],
  memes: [
    /\b(meme|viral|tiktok|trend|challenge|cringe|brainrot|slay|based|ratio|cap|sus|bussin|rizz|sigma|skibidi)\b/i,
  ],
};

const NormalizerService = {
  /**
   * Infer a category from a keyword and optional metadata.
   */
  inferCategory(keyword, metadata = {}) {
    const text = [
      keyword,
      ...(metadata.tags || []),
      ...(metadata.related_queries || []),
      metadata.subreddit || '',
    ].join(' ');

    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return category;
        }
      }
    }
    return null; // uncategorized
  },

  /**
   * Merge trends from multiple sources into unified keyword records.
   * Groups by keyword_normalized and aggregates data.
   */
  mergeTrends(allTrends) {
    const merged = new Map();

    for (const trend of allTrends) {
      const key = `${trend.keyword_normalized}:${trend.country_code}`;

      if (merged.has(key)) {
        const existing = merged.get(key);
        
        // Add source if not already present
        if (!existing.sources.includes(trend.source)) {
          existing.sources.push(trend.source);
        }

        // Keep highest volume
        if (trend.source_volume && trend.source_volume > (existing.peak_volume || 0)) {
          existing.peak_volume = trend.source_volume;
        }

        // Accumulate growth percentages
        if (trend.source_growth_pct) {
          existing.growth_pcts.push(trend.source_growth_pct);
        }

        // Keep the best rank
        if (trend.source_rank && trend.source_rank < (existing.best_rank || Infinity)) {
          existing.best_rank = trend.source_rank;
        }

        // Infer category if not yet set
        if (!existing.category_slug) {
          existing.category_slug = trend.category_slug ||
            this.inferCategory(trend.keyword, trend.source_metadata);
        }
      } else {
        merged.set(key, {
          keyword: trend.keyword,
          keyword_normalized: trend.keyword_normalized,
          country_code: trend.country_code,
          category_slug: trend.category_slug || this.inferCategory(trend.keyword, trend.source_metadata),
          sources: [trend.source],
          peak_volume: trend.source_volume || 0,
          growth_pcts: trend.source_growth_pct ? [trend.source_growth_pct] : [],
          best_rank: trend.source_rank || 99,
        });
      }
    }

    return Array.from(merged.values());
  },
};

module.exports = NormalizerService;
