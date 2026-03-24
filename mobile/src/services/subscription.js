/**
 * RevenueCat subscription service.
 * Handles purchase flows, restoration, and subscription state.
 */
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import revenueCatConfig from '../config/revenuecat';

let isInitialized = false;

const SubscriptionService = {
  /**
   * Initialize RevenueCat SDK. Call once at app start.
   */
  async initialize(userId) {
    if (isInitialized) return;

    try {
      if (Platform.OS === 'ios') {
        await Purchases.configure({
          apiKey: revenueCatConfig.apiKey,
          appUserID: userId, // Link to Supabase user ID
        });
      } else {
        await Purchases.configure({
          apiKey: revenueCatConfig.apiKey,
          appUserID: userId,
        });
      }
      isInitialized = true;
    } catch (err) {
      console.error('Failed to initialize RevenueCat:', err);
    }
  },

  /**
   * Get available subscription packages.
   */
  async getOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        return {
          monthly: offerings.current.availablePackages.find(
            (p) => p.packageType === 'MONTHLY'
          ),
          annual: offerings.current.availablePackages.find(
            (p) => p.packageType === 'ANNUAL'
          ),
          all: offerings.current.availablePackages,
        };
      }
      return null;
    } catch (err) {
      console.error('Failed to get offerings:', err);
      return null;
    }
  },

  /**
   * Purchase a subscription package.
   */
  async purchase(packageToPurchase) {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      const isPremium = customerInfo.entitlements.active[revenueCatConfig.entitlementId];
      return { success: true, isPremium: !!isPremium, customerInfo };
    } catch (err) {
      if (err.userCancelled) {
        return { success: false, cancelled: true };
      }
      console.error('Purchase failed:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Restore previous purchases.
   */
  async restore() {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = customerInfo.entitlements.active[revenueCatConfig.entitlementId];
      return { success: true, isPremium: !!isPremium, customerInfo };
    } catch (err) {
      console.error('Restore failed:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Check current subscription status.
   */
  async checkSubscription() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isPremium = customerInfo.entitlements.active[revenueCatConfig.entitlementId];
      return {
        isPremium: !!isPremium,
        expiresAt: isPremium?.expirationDate || null,
        managementUrl: customerInfo.managementURL,
      };
    } catch (err) {
      console.error('Subscription check failed:', err);
      return { isPremium: false };
    }
  },

  /**
   * Update the app user ID (e.g. after login).
   */
  async login(userId) {
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      return customerInfo;
    } catch (err) {
      console.error('RevenueCat login failed:', err);
      return null;
    }
  },

  /**
   * Log out of RevenueCat.
   */
  async logout() {
    try {
      await Purchases.logOut();
    } catch (err) {
      console.error('RevenueCat logout failed:', err);
    }
  },
};

export default SubscriptionService;
