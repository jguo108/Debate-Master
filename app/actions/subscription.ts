'use server'

import { createClient } from '@/lib/supabase/server'
import { checkFeatureAccess, recordUsage, getUserSubscription } from '@/lib/subscription/check'

export async function checkAIDebateAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { allowed: false, reason: 'Please sign in to start a debate.' }
  }

  return await checkFeatureAccess(user.id, 'ai_debate')
}

export async function checkFriendChallengeAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { allowed: false, reason: 'Please sign in to challenge a friend.' }
  }

  return await checkFeatureAccess(user.id, 'friend_challenge')
}

export async function recordAIDebateUsage(debateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  await recordUsage(user.id, 'ai_debate', { debate_id: debateId })
}

export async function recordFriendChallengeUsage(debateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  await recordUsage(user.id, 'friend_challenge', { debate_id: debateId })
}

export async function getSubscriptionStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { tier: 'free' as const, isActive: true, expiresAt: null }
  }

  return await getUserSubscription(user.id)
}

export async function getAllowedAIModels() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return ['gemini']
  
  const { getAllowedAIModels: getModels } = await import('@/lib/subscription/check')
  return await getModels(user.id)
}

export async function getAllowedTimeLimits() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return [1, 5, 10]
  
  const { getAllowedTimeLimits: getLimits } = await import('@/lib/subscription/check')
  return await getLimits(user.id)
}
