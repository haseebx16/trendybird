/**
 * RevenueCat configuration.
 * Uses the PUBLIC SDK key (safe for client-side).
 */
import { Platform } from 'react-native';

const REVENUECAT_IOS_KEY = 'your_revenuecat_ios_public_key';
const REVENUECAT_ANDROID_KEY = 'your_revenuecat_android_public_key';

export default {
  apiKey: Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY,
  entitlementId: 'premium',  // Must match your RevenueCat entitlement name
  products: {
    monthly: 'trendybird_monthly',
    yearly: 'trendybird_yearly',
  },
};
