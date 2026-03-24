/**
 * HomeScreen — Main trending feed with filters.
 * Shows top momentum-scored trends for selected country and category.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TrendCard from '../components/TrendCard';
import CategoryChip from '../components/CategoryChip';
import CountryPicker from '../components/CountryPicker';
import { LoadingState, EmptyState, ErrorState } from '../components/LoadingState';
import { useTrends } from '../hooks/useTrends';
import { useCountries, useCategories } from '../hooks/useCountries';
import { useAuth } from '../store/AuthContext';
import { colors, spacing, fontSizes, borderRadius } from '../config/theme';

export default function HomeScreen({ navigation }) {
  const { profile } = useAuth();
  const [country, setCountry] = useState(profile?.preferences?.preferred_country || 'US');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);

  const { trends, pagination, isLoading, isRefreshing, error, refresh } = useTrends({
    country,
    category,
    page,
  });
  const { countries } = useCountries();
  const { categories } = useCategories();

  const handleTrendPress = useCallback((trend) => {
    navigation.navigate('TrendDetail', { trendId: trend.id, keyword: trend.keyword });
  }, [navigation]);

  const handleCategoryPress = useCallback((cat) => {
    setCategory(cat.slug);
    setPage(1);
  }, []);

  const handleCountryChange = useCallback((code) => {
    setCountry(code);
    setPage(1);
  }, []);

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Title bar */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>🐦‍🔥 TrendyBird</Text>
          <Text style={styles.subtitle}>What's about to blow up</Text>
        </View>
      </View>

      {/* Country picker */}
      <View style={styles.countryRow}>
        <CountryPicker
          countries={countries}
          selected={country}
          onSelect={handleCountryChange}
        />
      </View>

      {/* Category chips - horizontal scroll */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.categoryScroll}
        renderItem={({ item }) => (
          <CategoryChip
            category={item}
            isSelected={category === item.slug}
            onPress={handleCategoryPress}
          />
        )}
      />
    </View>
  );

  // Loading state
  if (isLoading && trends.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        {renderHeader()}
        <LoadingState />
      </SafeAreaView>
    );
  }

  // Error state
  if (error && trends.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        {renderHeader()}
        <ErrorState
          message={error.isSubscriptionRequired
            ? 'Subscription required to view trends.'
            : error.message
          }
          onRetry={refresh}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <FlatList
        data={trends}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            title="No trends found"
            subtitle={`No trending data available for ${country} in ${category}.`}
            icon="search"
          />
        }
        renderItem={({ item, index }) => (
          <View style={styles.cardContainer}>
            <TrendCard
              trend={item}
              index={index}
              onPress={handleTrendPress}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerContent: {
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  countryRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  categoryScroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  cardContainer: {
    paddingHorizontal: spacing.md,
  },
});
