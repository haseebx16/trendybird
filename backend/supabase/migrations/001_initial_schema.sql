-- ===========================================
-- TrendyBird — Initial Database Schema
-- Run this in Supabase SQL Editor
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. COUNTRIES TABLE
-- ===========================================
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(5) NOT NULL UNIQUE,          -- ISO 3166-1 alpha-2 (US, GB, IN, BR...)
  name VARCHAR(100) NOT NULL,
  region VARCHAR(50),                        -- continent/region grouping
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed core countries
INSERT INTO countries (code, name, region) VALUES
  ('US', 'United States', 'North America'),
  ('GB', 'United Kingdom', 'Europe'),
  ('CA', 'Canada', 'North America'),
  ('AU', 'Australia', 'Oceania'),
  ('IN', 'India', 'Asia'),
  ('BR', 'Brazil', 'South America'),
  ('DE', 'Germany', 'Europe'),
  ('FR', 'France', 'Europe'),
  ('JP', 'Japan', 'Asia'),
  ('KR', 'South Korea', 'Asia'),
  ('MX', 'Mexico', 'North America'),
  ('NG', 'Nigeria', 'Africa'),
  ('ZA', 'South Africa', 'Africa'),
  ('AE', 'United Arab Emirates', 'Middle East'),
  ('SG', 'Singapore', 'Asia'),
  ('PH', 'Philippines', 'Asia'),
  ('ID', 'Indonesia', 'Asia'),
  ('TR', 'Turkey', 'Europe'),
  ('IT', 'Italy', 'Europe'),
  ('ES', 'Spain', 'Europe'),
  ('SE', 'Sweden', 'Europe'),
  ('NL', 'Netherlands', 'Europe'),
  ('PL', 'Poland', 'Europe'),
  ('AR', 'Argentina', 'South America'),
  ('CO', 'Colombia', 'South America'),
  ('EG', 'Egypt', 'Africa'),
  ('SA', 'Saudi Arabia', 'Middle East'),
  ('TH', 'Thailand', 'Asia'),
  ('VN', 'Vietnam', 'Asia'),
  ('PK', 'Pakistan', 'Asia'),
  ('GLOBAL', 'Global (Worldwide)', 'Global');

-- ===========================================
-- 2. CATEGORIES TABLE
-- ===========================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(50) NOT NULL UNIQUE,          -- url-safe key
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),                           -- emoji or icon name
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (slug, name, description, icon, sort_order) VALUES
  ('all', 'All', 'All categories', '🔥', 0),
  ('tech', 'Technology', 'Software, AI, gadgets, startups', '💻', 1),
  ('entertainment', 'Entertainment', 'Movies, TV, music, celebrities', '🎬', 2),
  ('gaming', 'Gaming', 'Video games, esports, streaming', '🎮', 3),
  ('sports', 'Sports', 'All sports and fitness', '⚽', 4),
  ('fashion', 'Fashion & Beauty', 'Clothing, makeup, style trends', '👗', 5),
  ('food', 'Food & Drink', 'Recipes, restaurants, food trends', '🍕', 6),
  ('health', 'Health & Wellness', 'Fitness, mental health, medicine', '🏥', 7),
  ('finance', 'Finance & Crypto', 'Markets, crypto, personal finance', '💰', 8),
  ('politics', 'Politics & News', 'Current events and political trends', '📰', 9),
  ('science', 'Science', 'Research, space, discoveries', '🔬', 10),
  ('travel', 'Travel', 'Destinations, travel tips', '✈️', 11),
  ('education', 'Education', 'Learning, courses, skills', '📚', 12),
  ('memes', 'Memes & Culture', 'Internet culture and viral content', '😂', 13);

-- ===========================================
-- 3. TRENDS TABLE — raw trend data from all sources
-- ===========================================
CREATE TABLE trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword VARCHAR(500) NOT NULL,
  keyword_normalized VARCHAR(500) NOT NULL,   -- lowercase, trimmed, deduped
  source VARCHAR(30) NOT NULL,                -- 'google_trends', 'youtube', 'reddit'
  country_code VARCHAR(5) NOT NULL,           -- references countries.code
  category_slug VARCHAR(50),                  -- references categories.slug
  
  -- Source-specific data
  source_volume INTEGER,                      -- Google: search volume, YouTube: view count
  source_growth_pct DECIMAL(8,2),             -- % growth from source
  source_rank INTEGER,                        -- rank in source's listing
  source_metadata JSONB DEFAULT '{}',         -- flexible extra data per source
  
  -- Time tracking
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trend_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate entries per source/keyword/country/date
CREATE UNIQUE INDEX idx_trends_dedup 
  ON trends (keyword_normalized, source, country_code, trend_date);

-- Fast lookups by country + date (most common query pattern)
CREATE INDEX idx_trends_country_date 
  ON trends (country_code, trend_date DESC);

-- Fast lookups by category
CREATE INDEX idx_trends_category 
  ON trends (category_slug, trend_date DESC);

-- Full-text search on keywords
CREATE INDEX idx_trends_keyword_search 
  ON trends USING gin(to_tsvector('english', keyword));

-- ===========================================
-- 4. TREND_SCORES TABLE — computed momentum scores
-- ===========================================
CREATE TABLE trend_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_normalized VARCHAR(500) NOT NULL,
  country_code VARCHAR(5) NOT NULL,
  category_slug VARCHAR(50),
  
  -- The Trend Momentum Score (0–100)
  momentum_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Score components (for transparency & debugging)
  velocity_score DECIMAL(5,2) DEFAULT 0,      -- how fast it's growing
  freshness_score DECIMAL(5,2) DEFAULT 0,     -- how new/unsaturated
  cross_platform_score DECIMAL(5,2) DEFAULT 0, -- appears on multiple sources
  volume_score DECIMAL(5,2) DEFAULT 0,        -- absolute volume signal
  
  -- Composite data
  sources_detected TEXT[] DEFAULT '{}',        -- e.g. {'google_trends','youtube'}
  source_count INTEGER DEFAULT 1,
  peak_volume INTEGER DEFAULT 0,
  avg_growth_pct DECIMAL(8,2) DEFAULT 0,
  
  -- Time
  scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One score per keyword/country/date
CREATE UNIQUE INDEX idx_scores_dedup 
  ON trend_scores (keyword_normalized, country_code, score_date);

-- Primary query: top scores by country, sorted by momentum
CREATE INDEX idx_scores_country_momentum 
  ON trend_scores (country_code, score_date DESC, momentum_score DESC);

-- Category filtering
CREATE INDEX idx_scores_category_momentum 
  ON trend_scores (category_slug, score_date DESC, momentum_score DESC);

-- ===========================================
-- 5. USERS TABLE — extends Supabase auth.users
-- ===========================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  display_name VARCHAR(100),
  avatar_url TEXT,
  
  -- Subscription (synced from RevenueCat)
  subscription_status VARCHAR(30) DEFAULT 'none',  -- none, trial, active, expired, cancelled
  subscription_plan VARCHAR(50),                     -- monthly, yearly, lifetime
  subscription_expires_at TIMESTAMPTZ,
  revenuecat_id VARCHAR(255),                        -- RevenueCat app_user_id
  
  -- Preferences
  preferred_country VARCHAR(5) DEFAULT 'US',
  preferred_categories TEXT[] DEFAULT '{"all"}',
  
  -- Meta
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_subscription 
  ON users (subscription_status);

CREATE INDEX idx_users_revenuecat 
  ON users (revenuecat_id);

-- ===========================================
-- 6. SUBSCRIPTION_HISTORY TABLE
-- ===========================================
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,            -- purchase, renewal, cancellation, expiration, billing_issue
  plan VARCHAR(50),
  amount_usd DECIMAL(8,2),
  currency VARCHAR(3) DEFAULT 'USD',
  provider VARCHAR(30),                        -- app_store, play_store, stripe
  revenuecat_event_id VARCHAR(255),
  raw_payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sub_history_user 
  ON subscription_history (user_id, created_at DESC);

-- ===========================================
-- 7. TREND_SNAPSHOTS TABLE — historical data for velocity calc
-- ===========================================
CREATE TABLE trend_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_normalized VARCHAR(500) NOT NULL,
  country_code VARCHAR(5) NOT NULL,
  source VARCHAR(30) NOT NULL,
  volume INTEGER DEFAULT 0,
  growth_pct DECIMAL(8,2) DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast velocity lookups: recent snapshots per keyword
CREATE INDEX idx_snapshots_keyword_time 
  ON trend_snapshots (keyword_normalized, country_code, snapshot_at DESC);

-- Auto-cleanup: partition-friendly index on time
CREATE INDEX idx_snapshots_time 
  ON trend_snapshots (snapshot_at);

-- ===========================================
-- 8. ROW LEVEL SECURITY
-- ===========================================

-- Trends & scores: readable by any authenticated user (paywall enforced at API layer)
ALTER TABLE trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access for countries & categories (no auth needed)
CREATE POLICY "Countries are publicly readable" ON countries
  FOR SELECT USING (true);

CREATE POLICY "Categories are publicly readable" ON categories
  FOR SELECT USING (true);

-- Trends & scores: only authenticated users can read
CREATE POLICY "Authenticated users can read trends" ON trends
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read scores" ON trend_scores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read snapshots" ON trend_snapshots
  FOR SELECT TO authenticated USING (true);

-- Users: can only read/update their own row
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Subscription history: users can read own history
CREATE POLICY "Users can read own subscription history" ON subscription_history
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Service role (backend) has full access by default (bypasses RLS)

-- ===========================================
-- 9. FUNCTIONS — auto-create user profile on signup
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile when auth.users row is inserted
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- 10. FUNCTION — update updated_at timestamp
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_trends
  BEFORE UPDATE ON trends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
