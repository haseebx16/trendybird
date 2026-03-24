/**
 * App theme — dark-first design for a data-heavy trend app.
 */
export const colors = {
  // Background
  bg: '#0F0F23',
  bgCard: '#1A1A2E',
  bgElevated: '#252542',
  bgInput: '#16213E',

  // Primary accent
  primary: '#6C63FF',
  primaryLight: '#8B83FF',
  primaryDark: '#4A42CC',

  // Score colors
  scoreExploding: '#FF4757',  // 85-100
  scoreHot: '#FF6B6B',        // 65-84
  scoreRising: '#FFA502',     // 45-64
  scoreWarm: '#FFD93D',       // 25-44
  scoreCold: '#48DBFB',       // 0-24

  // Text
  text: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#6C6C8A',

  // Borders & dividers
  border: '#2A2A4A',
  divider: '#1E1E3A',

  // Status
  success: '#2ED573',
  error: '#FF4757',
  warning: '#FFA502',
  info: '#48DBFB',

  // Platform source colors
  googleTrends: '#4285F4',
  youtube: '#FF0000',
  reddit: '#FF4500',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  hero: 36,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

/**
 * Get score color based on momentum score value.
 */
export const getScoreColor = (score) => {
  if (score >= 85) return colors.scoreExploding;
  if (score >= 65) return colors.scoreHot;
  if (score >= 45) return colors.scoreRising;
  if (score >= 25) return colors.scoreWarm;
  return colors.scoreCold;
};

/**
 * Get score label based on momentum score value.
 */
export const getScoreLabel = (score) => {
  if (score >= 85) return 'EXPLODING';
  if (score >= 65) return 'HOT';
  if (score >= 45) return 'RISING';
  if (score >= 25) return 'WARM';
  return 'COLD';
};
