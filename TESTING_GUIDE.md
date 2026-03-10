# Subscription System Testing Guide

This guide will help you test the subscription system with Free and Pro tiers.

## Prerequisites

1. **Run the Database Migration**
   - Open Supabase Dashboard → SQL Editor
   - Run the SQL from `supabase_migration.sql`
   - This creates the subscription fields and usage tracking table

2. **Make sure your app is running**
   ```bash
   npm run dev
   ```

## Testing Steps

### Step 1: Test Free Tier Limits

1. **Set a user to Free tier:**
   - Go to Supabase SQL Editor
   - Run this query (replace `YOUR_USER_ID` with your actual user ID):
   ```sql
   UPDATE profiles 
   SET subscription_tier = 'free', 
       subscription_expires_at = NULL
   WHERE id = 'YOUR_USER_ID';
   ```

2. **Find your User ID:**
   - In Supabase Dashboard → Authentication → Users
   - Or run: `SELECT id, email FROM auth.users;`

3. **Test AI Debate Limit (3 per month):**
   - Go to `/debate/practice`
   - You should see a usage counter showing "0 of 3 AI debates used"
   - Start 3 AI debates
   - On the 4th attempt, you should see an error message: "You've reached your monthly limit of 3 AI debates"
   - Only Gemini model should be available (GPT-4o and Claude should show "PRO" badge)

4. **Test Time Limit Restrictions:**
   - On the practice page, only 1, 5, and 10 minute options should be enabled
   - 20, 30, and 60 minute options should be disabled with a crown icon

5. **Test Friend Challenge Limit (1 per month):**
   - Go to `/debate/challenge`
   - You should see usage counter showing "0 of 1 friend challenges used"
   - Send 1 challenge to a friend
   - On the 2nd attempt, you should see an error message

6. **Test History Limit (Last 10 debates):**
   - Go to `/debates` → History tab
   - Free users should only see the last 10 concluded debates
   - Older debates should not appear

### Step 2: Test Pro Tier (Unlimited)

1. **Upgrade user to Pro:**
   ```sql
   UPDATE profiles 
   SET subscription_tier = 'pro', 
       subscription_expires_at = NULL
   WHERE id = 'YOUR_USER_ID';
   ```

2. **Refresh the app** (or sign out and sign back in)

3. **Verify Pro Features:**
   - **AI Debates:** Should be unlimited (no usage counter, no limits)
   - **AI Models:** All three models (Gemini, GPT-4o, Claude) should be available
   - **Time Limits:** All options (1, 5, 10, 20, 30, 60) should be enabled
   - **Friend Challenges:** Should be unlimited
   - **History:** Should show all debates (unlimited)

4. **Check Settings Page:**
   - Go to `/settings`
   - You should see "Pro Subscription" with a crown icon
   - All features should show "Unlimited" or "All Models"

### Step 3: Test Usage Tracking

1. **Check usage in database:**
   ```sql
   SELECT 
     feature_type,
     COUNT(*) as count,
     DATE_TRUNC('month', created_at) as month
   FROM usage_tracking
   WHERE user_id = 'YOUR_USER_ID'
   GROUP BY feature_type, DATE_TRUNC('month', created_at);
   ```

2. **Verify usage is recorded:**
   - Each AI debate should create an entry with `feature_type = 'ai_debate'`
   - Each friend challenge should create an entry with `feature_type = 'friend_challenge'`

### Step 4: Test Expired Pro Subscription

1. **Set Pro subscription to expired:**
   ```sql
   UPDATE profiles 
   SET subscription_tier = 'pro', 
       subscription_expires_at = NOW() - INTERVAL '1 day'
   WHERE id = 'YOUR_USER_ID';
   ```

2. **Verify user is treated as Free:**
   - Should have Free tier limits
   - Should only see Gemini model
   - Should have time limit restrictions

### Step 5: Reset for Testing

**Clear usage for a user:**
```sql
DELETE FROM usage_tracking 
WHERE user_id = 'YOUR_USER_ID'
  AND created_at >= DATE_TRUNC('month', NOW());
```

## Expected Behaviors

### Free Tier:
- ✅ 3 AI debates per month
- ✅ 1 friend challenge per month
- ✅ Only Gemini AI model available
- ✅ Time limits: 1, 5, 10 minutes only
- ✅ Last 10 debates in history

### Pro Tier:
- ✅ Unlimited AI debates
- ✅ Unlimited friend challenges
- ✅ All AI models (Gemini, GPT-4o, Claude)
- ✅ All time limits (1, 5, 10, 20, 30, 60 minutes)
- ✅ Unlimited history

## Troubleshooting

**Issue: Usage not being recorded**
- Check browser console for errors
- Verify `usage_tracking` table exists and has RLS policies
- Check that `recordAIDebateUsage` and `recordFriendChallengeUsage` are being called

**Issue: Limits not enforced**
- Verify user's `subscription_tier` in database
- Check that `checkFeatureAccess` is being called
- Look for errors in server logs

**Issue: Pro features not showing**
- Clear browser cache
- Sign out and sign back in
- Verify `subscription_tier = 'pro'` and `subscription_expires_at` is NULL or in the future

## Quick Test Checklist

- [ ] Free tier: AI debate limit (3/month) enforced
- [ ] Free tier: Friend challenge limit (1/month) enforced
- [ ] Free tier: Only Gemini model available
- [ ] Free tier: Only 1, 5, 10 minute time limits
- [ ] Free tier: Only last 10 debates in history
- [ ] Pro tier: Unlimited AI debates
- [ ] Pro tier: All AI models available
- [ ] Pro tier: All time limits available
- [ ] Pro tier: Unlimited history
- [ ] Usage tracking records entries correctly
- [ ] Settings page shows correct subscription status
