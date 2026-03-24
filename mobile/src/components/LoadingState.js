/**
 * Loading & empty state components.
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSizes } from '../config/theme';

export function LoadingState({ message = 'Loading trends...' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

export function EmptyState({ title = 'No trends found', subtitle, icon = 'inbox' }) {
  return (
    <View style={styles.container}>
      <Feather name={icon} size={48} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <View style={styles.container}>
      <Feather name="alert-circle" size={48} color={colors.error} />
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.subtitle}>{message}</Text>
      {onRetry && (
        <Text style={styles.retryButton} onPress={onRetry}>
          Tap to retry
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  message: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    marginTop: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
});
