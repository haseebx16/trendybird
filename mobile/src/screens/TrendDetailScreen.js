/**
 * TrendDetailScreen — Detailed score breakdown for a single trend.
 * Shows momentum score, component scores, sources, and metadata.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ScoreBadge from '../components/ScoreBadge';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { useTrendDetail } from '../hooks/useTrends';
import { colors, spacing, fontSizes, borderRadius, getScoreColor, getScoreLabel } from '../config/theme';
import { formatNumber, formatPercent, formatTimeAgo, getSourceInfo } from '../utils/formatters';

export default function TrendDetailScreen({ route }) {
  const { trendId, keyword } = route.params;
  const { trend, isLoading, error } = useTrendDetail(trendId);

  if (isLoading) return <LoadingState message="Loading trend details..." />;
  if (error) return <ErrorState message="Failed to load trend." />;
  if (!trend) return <ErrorState message="Trend not found." />;

  const scoreColor = getScoreColor(trend.momentum_score);
  const scoreLabel = getScoreLabel(trend.momentum_score);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero section */}
        <View style={styles.hero}>
          <Text style={styles.keyword}>{trend.keyword}</Text>
          <View style={styles.scoreLarge}>
            <ScoreBadge score={trend.momentum_score} size="lg" showLabel />
          </View>
          <Text style={[styles.scoreStatus, { color: scoreColor }]}>
            {scoreLabel}
          </Text>
        </View>

        {/* Score breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          <View style={styles.scoreGrid}>
            <ScoreComponent
              label="Velocity"
              value={trend.scores.velocity}
              icon="trending-up"
              description="Growth speed"
            />
            <ScoreComponent
              label="Freshness"
              value={trend.scores.freshness}
              icon="sunrise"
              description="How new"
            />
            <ScoreComponent
              label="Cross-Platform"
              value={trend.scores.cross_platform}
              icon="layers"
              description="Multi-source"
            />
            <ScoreComponent
              label="Volume"
              value={trend.scores.volume}
              icon="bar-chart"
              description="Popularity"
            />
          </View>
        </View>

        {/* Sources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Detected on {trend.source_count} platform{trend.source_count > 1 ? 's' : ''}
          </Text>
          <View style={styles.sourcesGrid}>
            {trend.sources?.map((source) => {
              const info = getSourceInfo(source);
              return (
                <View key={source} style={[styles.sourceCard, { borderColor: info.color }]}>
                  <View style={[styles.sourceIcon, { backgroundColor: `${info.color}20` }]}>
                    <Feather name={info.icon} size={20} color={info.color} />
                  </View>
                  <Text style={styles.sourceName}>{info.name}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <StatItem label="Peak Volume" value={formatNumber(trend.peak_volume)} />
            <StatItem label="Avg Growth" value={formatPercent(trend.avg_growth_pct)} />
            <StatItem label="Country" value={trend.country} />
            <StatItem label="Category" value={trend.category || 'Uncategorized'} />
            <StatItem label="Last Scored" value={formatTimeAgo(trend.scored_at)} />
            <StatItem label="Date" value={trend.score_date} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreComponent({ label, value, icon, description }) {
  const scoreColor = getScoreColor(value);
  return (
    <View style={styles.scoreCard}>
      <View style={styles.scoreCardHeader}>
        <Feather name={icon} size={16} color={scoreColor} />
        <Text style={styles.scoreCardLabel}>{label}</Text>
      </View>
      <Text style={[styles.scoreCardValue, { color: scoreColor }]}>
        {Math.round(value)}
      </Text>
      <Text style={styles.scoreCardDesc}>{description}</Text>
      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View
          style={[styles.progressFill, {
            width: `${Math.min(value, 100)}%`,
            backgroundColor: scoreColor,
          }]}
        />
      </View>
    </View>
  );
}

function StatItem({ label, value }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  keyword: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  scoreLarge: {
    marginBottom: spacing.sm,
  },
  scoreStatus: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    letterSpacing: 2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scoreCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  scoreCardLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  scoreCardValue: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
  },
  scoreCardDesc: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    marginBottom: spacing.sm,
  },
  progressBg: {
    height: 4,
    backgroundColor: colors.bgElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  sourcesGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sourceCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    gap: spacing.sm,
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceName: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statItem: {
    width: '48%',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
});
