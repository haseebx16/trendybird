/**
 * TrendCard — list item for a trending keyword with score and metadata.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScoreBadge from './ScoreBadge';
import { colors, spacing, fontSizes, borderRadius } from '../config/theme';
import { formatNumber, formatTimeAgo, getSourceInfo } from '../utils/formatters';

export default function TrendCard({ trend, onPress, index }) {
  const { keyword, momentum_score, scores, sources, source_count, peak_volume, scored_at, category } = trend;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(trend)}
      activeOpacity={0.7}
    >
      {/* Rank number */}
      <View style={styles.rankContainer}>
        <Text style={styles.rank}>#{index + 1}</Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Keyword */}
        <Text style={styles.keyword} numberOfLines={2}>
          {keyword}
        </Text>

        {/* Metadata row */}
        <View style={styles.metaRow}>
          {/* Sources */}
          <View style={styles.sourcesRow}>
            {sources?.map((source) => {
              const info = getSourceInfo(source);
              return (
                <View key={source} style={[styles.sourceTag, { backgroundColor: `${info.color}20` }]}>
                  <View style={[styles.sourceDot, { backgroundColor: info.color }]} />
                  <Text style={[styles.sourceText, { color: info.color }]}>
                    {info.name.split(' ')[0]}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Volume */}
          {peak_volume > 0 && (
            <View style={styles.volumeTag}>
              <Feather name="eye" size={10} color={colors.textMuted} />
              <Text style={styles.volumeText}>{formatNumber(peak_volume)}</Text>
            </View>
          )}
        </View>

        {/* Category + time */}
        <View style={styles.bottomRow}>
          {category && (
            <Text style={styles.categoryText}>{category}</Text>
          )}
          <Text style={styles.timeText}>{formatTimeAgo(scored_at)}</Text>
        </View>
      </View>

      {/* Score badge */}
      <ScoreBadge score={momentum_score} size="md" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rank: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginRight: spacing.md,
  },
  keyword: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sourcesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sourceText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  volumeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  volumeText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
});
