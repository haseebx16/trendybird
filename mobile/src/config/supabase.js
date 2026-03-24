/**
 * Supabase client for mobile app.
 * Uses ANON KEY (public, safe for client-side).
 * Auth tokens are stored in AsyncStorage.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-project.supabase.co';       // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';             // Replace with your anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // not needed for React Native
  },
});
