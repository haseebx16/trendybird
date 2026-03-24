/**
 * Formatting utilities for the UI.
 */

/**
 * Format a large number into a compact human-readable string.
 * 1234 → "1.2K", 1234567 → "1.2M"
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Format a percentage with + sign for positive values.
 */
export function formatPercent(pct) {
  if (pct === null || pct === undefined) return '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

/**
 * Format a relative time string ("2h ago", "5m ago").
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get source display info (name, color, icon).
 */
export function getSourceInfo(source) {
  const sources = {
    google_trends: { name: 'Google Trends', color: '#4285F4', icon: 'trending-up' },
    youtube: { name: 'YouTube', color: '#FF0000', icon: 'play-circle' },
    reddit: { name: 'Reddit', color: '#FF4500', icon: 'message-circle' },
  };
  return sources[source] || { name: source, color: '#888', icon: 'globe' };
}
