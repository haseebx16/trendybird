/**
 * API configuration for the TrendyBird backend.
 */

// Replace with your deployed backend URL
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://trendybird-api.onrender.com/api';

export default {
  baseUrl: API_BASE_URL,
  timeout: 15000, // 15 second timeout
};
