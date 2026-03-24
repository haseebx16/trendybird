/**
 * SettingsScreen — Profile, subscription management, and preferences.
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import { colors, spacing, fontSizes, borderRadius } from '../config/theme';

export default function SettingsScreen() {
  const { user, profile, signOut, isSubscribed } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleManageSubscription = () => {
    // Deep link to App Store / Play Store subscription management
    Linking.openURL(
      'https://apps.apple.com/account/subscriptions' // iOS
      // For Android: 'https://play.google.com/store/account/subscriptions'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.display_name || user?.email || '?')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.display_name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Subscription status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subRow}>
              <Feather
                name={isSubscribed ? 'check-circle' : 'alert-circle'}
                size={20}
                color={isSubscribed ? colors.success : colors.warning}
              />
              <View style={styles.subInfo}>
                <Text style={styles.subStatus}>
                  {isSubscribed ? 'Active' : (profile?.subscription?.status || 'None')}
                </Text>
                {profile?.subscription?.plan && (
                  <Text style={styles.subPlan}>{profile.subscription.plan}</Text>
                )}
                {profile?.subscription?.expires_at && (
                  <Text style={styles.subExpiry}>
                    Expires: {new Date(profile.subscription.expires_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.manageButton} onPress={handleManageSubscription}>
              <Text style={styles.manageText}>Manage</Text>
              <Feather name="external-link" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SettingsRow icon="globe" label="Default Country" value={profile?.preferences?.preferred_country || 'US'} />
          <SettingsRow icon="grid" label="Preferred Categories" value={`${profile?.preferences?.preferred_categories?.length || 1} selected`} />
        </View>

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <SettingsRow icon="info" label="App Version" value="1.0.0" />
          <TouchableOpacity onPress={() => Linking.openURL('https://trendybird.app/terms')}>
            <SettingsRow icon="file-text" label="Terms of Service" showChevron />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://trendybird.app/privacy')}>
            <SettingsRow icon="shield" label="Privacy Policy" showChevron />
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Feather name="log-out" size={18} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, label, value, showChevron }) {
  return (
    <View style={styles.row}>
      <Feather name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {showChevron && <Feather name="chevron-right" size={18} color={colors.textMuted} />}
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
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  profileEmail: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  subscriptionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  subInfo: {
    flex: 1,
  },
  subStatus: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  subPlan: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
  },
  subExpiry: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  manageText: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  rowLabel: {
    color: colors.text,
    fontSize: fontSizes.md,
    flex: 1,
  },
  rowValue: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: `${colors.error}10`,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  signOutText: {
    color: colors.error,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
});
