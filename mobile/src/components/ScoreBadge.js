/**
 * ScoreBadge — displays momentum score with color-coded indicator.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getScoreColor, getScoreLabel, colors, fontSizes, borderRadius } from '../config/theme';

export default function ScoreBadge({ score, size = 'md', showLabel = false }) {
  const scoreColor = getScoreColor(score);
  const label = getScoreLabel(score);

  const containerSize = size === 'lg' ? 64 : size === 'md' ? 48 : 36;
  const fontSize = size === 'lg' ? fontSizes.xl : size === 'md' ? fontSizes.lg : fontSizes.md;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.badge,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            borderColor: scoreColor,
            backgroundColor: `${scoreColor}15`,
          },
        ]}
      >
        <Text style={[styles.scoreText, { fontSize, color: scoreColor }]}>
          {Math.round(score)}
        </Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: scoreColor }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  scoreText: {
    fontWeight: '800',
  },
  label: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 1,
  },
});
