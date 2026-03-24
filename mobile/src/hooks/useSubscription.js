/**
 * Hook for managing subscription state and purchases.
 */
import { useState, useEffect, useCallback } from 'react';
import SubscriptionService from '../services/subscription';
import { useAuth } from '../store/AuthContext';

export function useSubscription() {
  const { user, isSubscribed, refreshProfile } = useAuth();
  const [offerings, setOfferings] = useState(null);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Initialize RevenueCat when user is available
  useEffect(() => {
    if (user?.id) {
      SubscriptionService.initialize(user.id);
      loadOfferings();
    }
  }, [user?.id]);

  const loadOfferings = useCallback(async () => {
    setIsLoadingOfferings(true);
    const result = await SubscriptionService.getOfferings();
    setOfferings(result);
    setIsLoadingOfferings(false);
  }, []);

  /**
   * Purchase a subscription package.
   * After purchase, refreshes profile to update subscription status.
   */
  const purchase = useCallback(async (packageToPurchase) => {
    setIsPurchasing(true);
    try {
      const result = await SubscriptionService.purchase(packageToPurchase);
      if (result.success && result.isPremium) {
        // Refresh profile to get updated subscription status from backend
        await refreshProfile();
      }
      return result;
    } finally {
      setIsPurchasing(false);
    }
  }, [refreshProfile]);

  /**
   * Restore previous purchases.
   */
  const restore = useCallback(async () => {
    setIsPurchasing(true);
    try {
      const result = await SubscriptionService.restore();
      if (result.success && result.isPremium) {
        await refreshProfile();
      }
      return result;
    } finally {
      setIsPurchasing(false);
    }
  }, [refreshProfile]);

  return {
    isSubscribed,
    offerings,
    isLoadingOfferings,
    isPurchasing,
    purchase,
    restore,
    loadOfferings,
  };
}
