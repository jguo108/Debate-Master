-- Reset All Users to Free Tier
-- Run this SQL in your Supabase SQL Editor to reset all users back to free tier
-- This is useful for testing the payment/upgrade process

-- Reset all users to free tier
UPDATE profiles 
SET subscription_tier = 'free',
    subscription_expires_at = NULL
WHERE subscription_tier = 'pro';

-- Optional: Clear all payment transactions (uncomment if you want a clean slate)
-- DELETE FROM payment_transactions;

-- Optional: Clear usage tracking (uncomment if you want to reset usage limits)
-- DELETE FROM usage_tracking;

-- Verify the changes
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
FROM profiles
ORDER BY created_at DESC;
