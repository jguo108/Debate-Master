-- Test Script for Subscription System
-- Run these queries in Supabase SQL Editor to test the subscription system

-- ============================================
-- 1. SET UP TEST USER AS FREE TIER
-- ============================================
-- Replace 'YOUR_USER_ID' with an actual user ID from your profiles table
-- First, find your user ID:
-- SELECT id, email, full_name FROM auth.users;

-- Set a user to FREE tier (default)
UPDATE profiles 
SET subscription_tier = 'free', 
    subscription_expires_at = NULL
WHERE id = 'YOUR_USER_ID';

-- ============================================
-- 2. TEST FREE TIER LIMITS
-- ============================================
-- Check current usage for a user (replace YOUR_USER_ID)
SELECT 
  feature_type,
  COUNT(*) as usage_count,
  DATE_TRUNC('month', created_at) as month
FROM usage_tracking
WHERE user_id = 'YOUR_USER_ID'
  AND created_at >= DATE_TRUNC('month', NOW())
GROUP BY feature_type, DATE_TRUNC('month', created_at);

-- Manually add usage entries to test limits (for testing only)
-- This simulates 3 AI debates (should block 4th)
INSERT INTO usage_tracking (user_id, feature_type, metadata)
VALUES 
  ('YOUR_USER_ID', 'ai_debate', '{"test": true}'),
  ('YOUR_USER_ID', 'ai_debate', '{"test": true}'),
  ('YOUR_USER_ID', 'ai_debate', '{"test": true}');

-- This simulates 1 friend challenge (should block 2nd)
INSERT INTO usage_tracking (user_id, feature_type, metadata)
VALUES 
  ('YOUR_USER_ID', 'friend_challenge', '{"test": true}');

-- ============================================
-- 3. UPGRADE USER TO PRO TIER
-- ============================================
-- Upgrade to Pro (no expiration)
UPDATE profiles 
SET subscription_tier = 'pro', 
    subscription_expires_at = NULL
WHERE id = 'YOUR_USER_ID';

-- Or upgrade to Pro with expiration (e.g., 30 days from now)
UPDATE profiles 
SET subscription_tier = 'pro', 
    subscription_expires_at = NOW() + INTERVAL '30 days'
WHERE id = 'YOUR_USER_ID';

-- ============================================
-- 4. CHECK SUBSCRIPTION STATUS
-- ============================================
-- View subscription status for all users
SELECT 
  id,
  full_name,
  subscription_tier,
  subscription_expires_at,
  CASE 
    WHEN subscription_tier = 'pro' AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW()) 
    THEN 'Active Pro'
    ELSE 'Free'
  END as current_status
FROM profiles;

-- ============================================
-- 5. RESET USAGE FOR TESTING
-- ============================================
-- Clear all usage for a user (for testing)
DELETE FROM usage_tracking 
WHERE user_id = 'YOUR_USER_ID';

-- Clear usage for current month only
DELETE FROM usage_tracking 
WHERE user_id = 'YOUR_USER_ID'
  AND created_at >= DATE_TRUNC('month', NOW());

-- ============================================
-- 6. VIEW USAGE STATISTICS
-- ============================================
-- Monthly usage summary
SELECT 
  p.id,
  p.full_name,
  p.subscription_tier,
  COUNT(CASE WHEN ut.feature_type = 'ai_debate' THEN 1 END) as ai_debates_this_month,
  COUNT(CASE WHEN ut.feature_type = 'friend_challenge' THEN 1 END) as friend_challenges_this_month
FROM profiles p
LEFT JOIN usage_tracking ut ON p.id = ut.user_id 
  AND ut.created_at >= DATE_TRUNC('month', NOW())
GROUP BY p.id, p.full_name, p.subscription_tier;
