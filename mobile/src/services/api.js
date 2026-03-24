/**
 * Axios API client — auto-attaches Supabase JWT to all requests.
 * All data requests go through the Express backend (never direct Supabase).
 */
import axios from 'axios';
import apiConfig from '../config/api';
import { supabase } from '../config/supabase';

export const apiClient = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
apiClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    // Token expired — try refreshing
    if (status === 401) {
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

      if (session && !refreshError) {
        // Retry the original request with new token
        error.config.headers.Authorization = `Bearer ${session.access_token}`;
        return apiClient.request(error.config);
      }
    }

    // Extract error message
    const message = error.response?.data?.message || error.message || 'An error occurred';
    const code = error.response?.data?.error || 'unknown_error';

    return Promise.reject({
      status,
      code,
      message,
      isSubscriptionRequired: code === 'subscription_required',
    });
  }
);
