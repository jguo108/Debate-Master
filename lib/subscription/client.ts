'use client'

import { createClient } from '@/lib/supabase/client'

export async function getUserSubscriptionClient(userId: string): Promise<{ tier: 'free' | 'pro' | null; isActive: boolean }> {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { tier: 'free', isActive: true }
  }

  const tier = (profile.subscription_tier || 'free') as 'free' | 'pro'
  const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
  const isActive = tier === 'pro' 
    ? (expiresAt === null || expiresAt > new Date())
    : true

  return { tier, isActive }
}
