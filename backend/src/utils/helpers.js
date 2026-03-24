/**
 * Shared utility/helper functions.
 */

/**
 * Normalize a keyword for deduplication.
 * Lowercase, trim, collapse whitespace, remove special chars.
 */
const normalizeKeyword = (keyword) => {
  if (!keyword) return '';
  return keyword
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')      // remove non-alphanumeric (keep hyphens)
    .replace(/\s+/g, ' ')          // collapse whitespace
    .substring(0, 500);            // enforce max length
};

/**
 * Sleep for ms milliseconds (for rate-limit-friendly sequential API calls).
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Clamp a number between min and max.
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Safe JSON parse — returns defaultValue on failure.
 */
const safeJsonParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

/**
 * Chunk an array into batches of given size.
 */
const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Get today's date as YYYY-MM-DD string.
 */
const todayDateString = () => new Date().toISOString().split('T')[0];

/**
 * Calculate percentage change between two values.
 */
const percentChange = (oldVal, newVal) => {
  if (oldVal === 0) return newVal > 0 ? 100 : 0;
  return ((newVal - oldVal) / Math.abs(oldVal)) * 100;
};

module.exports = {
  normalizeKeyword,
  sleep,
  clamp,
  safeJsonParse,
  chunk,
  todayDateString,
  percentChange,
};
