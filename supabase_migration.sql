-- Subscription System Migration
-- Run this SQL in your Supabase SQL Editor

-- Add subscription fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('ai_debate', 'friend_challenge')),
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month 
ON usage_tracking(user_id, feature_type, DATE_TRUNC('month', created_at));

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription 
ON profiles(subscription_tier, subscription_expires_at);

-- Enable Row Level Security (RLS) for usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own usage
CREATE POLICY "Users can insert own usage" ON usage_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
