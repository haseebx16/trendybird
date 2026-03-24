/**
 * Hook for fetching and managing trends data.
 */
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';

export function useTrends({
  country = 'US',
  category = 'all',
  page = 1,
  limit = 20,
  minScore = 0,
} = {}) {
  const [trends, setTrends] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrends = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await apiClient.get('/trends', {
        params: { country, category, page, limit, min_score: minScore },
      });

      if (response.data?.success) {
        setTrends(response.data.trends);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [country, category, page, limit, minScore]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const refresh = () => fetchTrends(true);

  return { trends, pagination, isLoading, isRefreshing, error, refresh };
}

/**
 * Hook for searching trends.
 */
export function useTrendSearch() {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query, country = 'US') => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await apiClient.get('/trends/search', {
        params: { q: query, country },
      });

      if (response.data?.success) {
        setResults(response.data.trends);
      }
    } catch (err) {
      console.error('Search failed:', err.message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { results, isSearching, search };
}

/**
 * Hook for fetching a single trend detail.
 */
export function useTrendDetail(trendId) {
  const [trend, setTrend] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!trendId) return;

    (async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(`/trends/${trendId}`);
        if (response.data?.success) {
          setTrend(response.data.trend);
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [trendId]);

  return { trend, isLoading, error };
}
