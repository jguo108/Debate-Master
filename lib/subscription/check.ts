'use server'

import { createClient } from '@/lib/supabase/server'

export type SubscriptionTier = 'free' | 'pro'
export type FeatureType = 'ai_debate' | 'friend_challenge' | 'ai_models' | 'time_limits' | 'history'

interface SubscriptionStatus {
  tier: SubscriptionTier
  isActive: boolean
  expiresAt: Date | null
}

export async function getUserSubscription(userId: string): Promise<SubscriptionStatus> {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { tier: 'free', isActive: true, expiresAt: null }
  }

  const tier = (profile.subscription_tier || 'free') as SubscriptionTier
  const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
  const isActive = tier === 'pro' 
    ? (expiresAt === null || expiresAt > new Date())
    : true

  return { tier, isActive, expiresAt }
}

export async function checkFeatureAccess(
  userId: string,
  feature: FeatureType
): Promise<{ allowed: boolean; reason?: string; usage?: { current: number; limit: number } }> {
  const subscription = await getUserSubscription(userId)
  const isPro = subscription.tier === 'pro' && subscription.isActive

  // Pro users have unlimited access to all features
  if (isPro) {
    return { allowed: true }
  }

  // Free tier limits
  switch (feature) {
    case 'ai_debate': {
      const usage = await getMonthlyUsage(userId, 'ai_debate')
      const limit = 3
      if (usage >= limit) {
        return {
          allowed: false,
          reason: `You've reached your monthly limit of ${limit} AI debates. Upgrade to Pro for unlimited debates.`,
          usage: { current: usage, limit }
        }
      }
      return { allowed: true, usage: { current: usage, limit } }
    }

    case 'friend_challenge': {
      const usage = await getMonthlyUsage(userId, 'friend_challenge')
      const limit = 1
      if (usage >= limit) {
        return {
          allowed: false,
          reason: `You've reached your monthly limit of ${limit} friend challenge. Upgrade to Pro for unlimited challenges.`,
          usage: { current: usage, limit }
        }
      }
      return { allowed: true, usage: { current: usage, limit } }
    }

    case 'ai_models':
      return { allowed: false, reason: 'Access to GPT-4o and Claude 3.5 Sonnet requires Pro subscription.' }

    case 'time_limits':
      // This will be checked in the UI component
      return { allowed: true }

    case 'history':
      // This will be checked when fetching history
      return { allowed: true }

    default:
      return { allowed: true }
  }
}

async function getMonthlyUsage(userId: string, featureType: 'ai_debate' | 'friend_challenge'): Promise<number> {
  const supabase = await createClient()
  
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const { count } = await supabase
    .from('usage_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature_type', featureType)
    .gte('created_at', startOfMonth.toISOString())

  return count || 0
}

export async function recordUsage(
  userId: string,
  featureType: 'ai_debate' | 'friend_challenge',
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from('usage_tracking')
    .insert({
      user_id: userId,
      feature_type: featureType,
      metadata: metadata || {}
    })
}

export async function getAllowedTimeLimits(userId: string): Promise<number[]> {
  const subscription = await getUserSubscription(userId)
  const isPro = subscription.tier === 'pro' && subscription.isActive
  
  return isPro 
    ? [1, 5, 10, 20, 30, 60]
    : [1, 5, 10]
}

export async function getAllowedAIModels(userId: string): Promise<string[]> {
  const subscription = await getUserSubscription(userId)
  const isPro = subscription.tier === 'pro' && subscription.isActive
  return isPro ? ['gemini', 'groq'] : ['groq']
}

export async function getHistoryLimit(userId: string): Promise<number | null> {
  const subscription = await getUserSubscription(userId)
  const isPro = subscription.tier === 'pro' && subscription.isActive
  
  return isPro ? null : 10 // null means unlimited
}
