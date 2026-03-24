/**
 * Auth Context — global authentication and subscription state.
 * 
 * Manages:
 * - Supabase auth session
 * - User profile from backend
 * - Subscription status
 * - Loading states
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { apiClient } from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setUser(session.user);
        fetchProfile(session.access_token);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session) {
          await fetchProfile(session.access_token);
        } else {
          setProfile(null);
          setIsSubscribed(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Fetch user profile (includes subscription status) from backend.
   */
  async function fetchProfile(accessToken) {
    try {
      const response = await apiClient.get('/user/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data?.success) {
        const userData = response.data.user;
        setProfile(userData);
        setIsSubscribed(
          userData.subscription?.status === 'active' ||
          userData.subscription?.status === 'trial'
        );
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err.message);
      // Don't crash — user can still use auth
    }
  }

  /**
   * Sign up with email and password.
   */
  async function signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) throw error;
    return data;
  }

  /**
   * Sign in with email and password.
   */
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  /**
   * Sign in with OAuth provider (Google, Apple).
   */
  async function signInWithOAuth(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'trendybird://auth/callback',
      },
    });
    if (error) throw error;
    return data;
  }

  /**
   * Sign out.
   */
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsSubscribed(false);
  }

  /**
   * Refresh profile data (call after subscription purchase).
   */
  async function refreshProfile() {
    if (session?.access_token) {
      await fetchProfile(session.access_token);
    }
  }

  /**
   * Get current access token for API calls.
   */
  function getAccessToken() {
    return session?.access_token || null;
  }

  const value = {
    session,
    user,
    profile,
    isLoading,
    isSubscribed,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    refreshProfile,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
