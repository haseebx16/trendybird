/**
 * Supabase client initialization.
 * 
 * Two clients:
 * - supabaseAdmin: uses SERVICE_ROLE_KEY — bypasses RLS, used by cron jobs & server writes
 * - supabaseClient: uses ANON_KEY — respects RLS, used for user-context queries
 */
const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

// Admin client — bypasses RLS (for cron jobs, data ingestion, admin ops)
const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Public client — respects RLS (for user-scoped reads)
const supabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Create a Supabase client scoped to a specific user's JWT.
 * This ensures RLS policies apply for that user.
 */
const getSupabaseForUser = (accessToken) => {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

module.exports = { supabaseAdmin, supabaseClient, getSupabaseForUser };
