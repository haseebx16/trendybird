/**
 * ExploreScreen — Search trends and browse by country/category.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import TrendCard from '../components/TrendCard';
import { LoadingState, EmptyState } from '../components/LoadingState';
import { useTrendSearch } from '../hooks/useTrends';
import { useAuth } from '../store/AuthContext';
import { colors, spacing, fontSizes, borderRadius } from '../config/theme';

export default function ExploreScreen({ navigation }) {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const { results, isSearching, search } = useTrendSearch();

  const handleSearch = useCallback((text) => {
    setQuery(text);
    // Debounce built into the component — search after 300ms
    const timeout = setTimeout(() => {
      search(text, profile?.preferences?.preferred_country || 'US');
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, profile]);

  const handleTrendPress = useCallback((trend) => {
    navigation.navigate('TrendDetail', { trendId: trend.id, keyword: trend.keyword });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Search header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search any trend, topic, or keyword..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); search(''); }}>
              <Feather name="x" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {isSearching ? (
        <LoadingState message="Searching..." />
      ) : query.length > 0 && results.length === 0 ? (
        <EmptyState
          title="No results"
          subtitle={`No trends found for "${query}". Try a different keyword.`}
          icon="search"
        />
      ) : query.length === 0 ? (
        <View style={styles.promptContainer}>
          <Feather name="search" size={48} color={colors.textMuted} />
          <Text style={styles.promptTitle}>Search Trends</Text>
          <Text style={styles.promptText}>
            Search for any topic, keyword, or trend to see its momentum score and cross-platform data.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.cardContainer}>
              <TrendCard trend={item} index={index} onPress={handleTrendPress} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    padding: spacing.md,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSizes.md,
    paddingVertical: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  cardContainer: {
    paddingHorizontal: spacing.md,
  },
  promptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  promptTitle: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: '700',
  },
  promptText: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
