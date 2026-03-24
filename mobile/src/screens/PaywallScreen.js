/**
 * PaywallScreen — Hard paywall. Users must subscribe before accessing any trend data.
 * Shows subscription plans and purchase buttons.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSubscription } from '../hooks/useSubscription';
import { colors, spacing, fontSizes, borderRadius } from '../config/theme';

const FEATURES = [
  { icon: 'zap', text: 'Real-time trend detection across Google, YouTube & Reddit' },
  { icon: 'globe', text: '30+ countries with region-specific data' },
  { icon: 'bar-chart-2', text: 'Momentum scores (0-100) with velocity tracking' },
  { icon: 'layers', text: '14 categories including Tech, Gaming, Finance & more' },
  { icon: 'bell', text: 'Trends refresh every 30 minutes' },
  { icon: 'shield', text: 'Catch trends before they go viral' },
];

export default function PaywallScreen() {
  const { offerings, isPurchasing, purchase, restore, isLoadingOfferings } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState('annual');

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'annual' ? offerings?.annual : offerings?.monthly;
    if (!pkg) {
      Alert.alert('Error', 'Subscription packages are not available right now.');
      return;
    }

    const result = await purchase(pkg);
    if (result.success) {
      // Navigation will handle the redirect to Home
    } else if (!result.cancelled) {
      Alert.alert('Error', result.error || 'Purchase failed. Please try again.');
    }
  };

  const handleRestore = async () => {
    const result = await restore();
    if (result.success && result.isPremium) {
      Alert.alert('Success', 'Your subscription has been restored!');
    } else {
      Alert.alert('No Subscription Found', 'We could not find an active subscription for this account.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🐦‍🔥</Text>
        <Text style={styles.title}>Unlock TrendyBird</Text>
        <Text style={styles.subtitle}>
          Get ahead of every trend. Detect what's about to blow up — before your competitors.
        </Text>
      </View>

      {/* Features list */}
      <View style={styles.features}>
        {FEATURES.map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather name={feature.icon} size={18} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>

      {/* Plan selector */}
      {isLoadingOfferings ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.plans}>
          {/* Annual plan */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('annual')}
          >
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>BEST VALUE</Text>
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>Yearly</Text>
              <Text style={styles.planPrice}>
                {offerings?.annual?.product?.priceString || '$49.99'}/yr
              </Text>
              <Text style={styles.planSub}>
                ~{offerings?.annual ? `$${(offerings.annual.product.price / 12).toFixed(2)}` : '$4.17'}/mo
              </Text>
            </View>
            <View style={[styles.radio, selectedPlan === 'annual' && styles.radioSelected]} />
          </TouchableOpacity>

          {/* Monthly plan */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planInfo}>
              <Text style={styles.planName}>Monthly</Text>
              <Text style={styles.planPrice}>
                {offerings?.monthly?.product?.priceString || '$6.99'}/mo
              </Text>
            </View>
            <View style={[styles.radio, selectedPlan === 'monthly' && styles.radioSelected]} />
          </TouchableOpacity>
        </View>
      )}

      {/* CTA Button */}
      <TouchableOpacity
        style={[styles.ctaButton, isPurchasing && styles.ctaDisabled]}
        onPress={handlePurchase}
        disabled={isPurchasing}
      >
        {isPurchasing ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.ctaText}>Start Subscription</Text>
        )}
      </TouchableOpacity>

      {/* Restore + Legal */}
      <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>

      <Text style={styles.legal}>
        Payment will be charged to your App Store / Google Play account.
        Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
      </Text>
    </ScrollView>
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  features: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    color: colors.text,
    fontSize: fontSizes.md,
    flex: 1,
    lineHeight: 20,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  plans: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    left: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  planBadgeText: {
    color: colors.text,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  planPrice: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: '800',
    marginTop: 2,
  },
  planSub: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '800',
  },
  restoreButton: {
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  restoreText: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    textDecorationLine: 'underline',
  },
  legal: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
});
