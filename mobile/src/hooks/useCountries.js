/**
 * Hook for fetching countries and categories.
 * These are public endpoints (no auth required).
 */
import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export function useCountries() {
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await apiClient.get('/countries');
        if (response.data?.success) {
          setCountries(response.data.countries);
        }
      } catch (err) {
        console.error('Failed to fetch countries:', err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { countries, isLoading };
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await apiClient.get('/categories');
        if (response.data?.success) {
          setCategories(response.data.categories);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { categories, isLoading };
}
