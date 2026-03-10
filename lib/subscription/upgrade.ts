'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Upgrade user subscription to Pro tier after successful payment
 * Sets subscription to Pro with expiration date (30 days for monthly subscription)
 */
export async function upgradeSubscription(userId: string, transactionId: string): Promise<void> {
  const supabase = await createClient()

  // Calculate expiration date (30 days from now for monthly subscription)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  // Update user's subscription
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'pro',
      subscription_expires_at: expiresAt.toISOString()
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to upgrade subscription: ${error.message}`)
  }
}

/**
 * Renew subscription (extend expiration date by 30 days)
 */
export async function renewSubscription(userId: string): Promise<void> {
  const supabase = await createClient()

  // Get current expiration date
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) {
    throw new Error('User profile not found')
  }

  // Calculate new expiration date
  const currentExpiresAt = profile.subscription_expires_at 
    ? new Date(profile.subscription_expires_at)
    : new Date()
  
  const newExpiresAt = new Date(currentExpiresAt)
  newExpiresAt.setDate(newExpiresAt.getDate() + 30)

  // Update subscription expiration
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_expires_at: newExpiresAt.toISOString()
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to renew subscription: ${error.message}`)
  }
}
