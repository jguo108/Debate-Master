'use server'

import { createClient } from '@/lib/supabase/server'
import { getPaymentProvider } from '@/lib/payment/providers'
import type { PaymentMethod, PaymentStatus } from '@/lib/payment/types'
import { getPaymentConfig } from '@/lib/payment/config'
import { upgradeSubscription } from '@/lib/subscription/upgrade'

export async function createPayment(paymentMethod: PaymentMethod) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get payment configuration
  const config = getPaymentConfig()

  // Get payment provider
  const provider = getPaymentProvider(paymentMethod)

  // Create payment request
  const paymentRequest = {
    amount: config.monthlyPrice.amount,
    currency: config.monthlyPrice.currency,
    paymentMethod,
    metadata: {
      userId: user.id,
      subscriptionType: 'monthly'
    }
  }

  // Create payment with provider
  const paymentResponse = await provider.createPayment(paymentRequest)

  // Store transaction in database
  const { data: transaction, error } = await supabase
    .from('payment_transactions')
    .insert({
      user_id: user.id,
      payment_method: paymentMethod,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      status: 'pending',
      transaction_id: paymentResponse.transactionId,
      qr_code_url: paymentResponse.qrCodeUrl,
      metadata: {
        ...paymentRequest.metadata,
        qrCodeData: paymentResponse.qrCodeData,
        expiresAt: paymentResponse.expiresAt.toISOString()
      }
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create payment transaction: ${error.message}`)
  }

  return {
    transactionId: paymentResponse.transactionId,
    qrCodeUrl: paymentResponse.qrCodeUrl,
    qrCodeData: paymentResponse.qrCodeData,
    expiresAt: paymentResponse.expiresAt,
    status: paymentResponse.status
  }
}

export async function getPaymentStatus(transactionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get transaction from database
  const { data: transaction, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('transaction_id', transactionId)
    .eq('user_id', user.id)
    .single()

  if (error || !transaction) {
    throw new Error('Transaction not found')
  }

  // Get status from payment provider
  const provider = getPaymentProvider(transaction.payment_method as PaymentMethod)
  const statusResponse = await provider.getPaymentStatus(transactionId)

  // Update transaction status in database if it changed
  if (statusResponse.status !== transaction.status) {
    const updateData: any = {
      status: statusResponse.status,
      updated_at: new Date().toISOString()
    }

    if (statusResponse.status === 'completed' && statusResponse.completedAt) {
      updateData.completed_at = statusResponse.completedAt.toISOString()
    }

    await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('id', transaction.id)

    // If payment is completed, upgrade subscription
    if (statusResponse.status === 'completed' && transaction.status !== 'completed') {
      try {
        await upgradeSubscription(user.id, transactionId)
      } catch (error) {
        console.error('Failed to upgrade subscription after payment:', error)
        // Don't throw - payment is still successful, subscription upgrade can be retried
      }
    }
  }

  return {
    transactionId: statusResponse.transactionId,
    status: statusResponse.status,
    amount: statusResponse.amount,
    currency: statusResponse.currency,
    completedAt: statusResponse.completedAt
  }
}

export async function cancelPayment(transactionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get transaction from database
  const { data: transaction, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('transaction_id', transactionId)
    .eq('user_id', user.id)
    .single()

  if (error || !transaction) {
    throw new Error('Transaction not found')
  }

  if (transaction.status === 'completed') {
    throw new Error('Cannot cancel completed payment')
  }

  // Cancel with payment provider
  const provider = getPaymentProvider(transaction.payment_method as PaymentMethod)
  const cancelled = await provider.cancelPayment(transactionId)

  if (cancelled) {
    // Update transaction status in database
    await supabase
      .from('payment_transactions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)
  }

  return cancelled
}

export async function handlePaymentWebhook(payload: any) {
  // For mock implementation, this simulates webhook processing
  // In real implementation, this would verify webhook signature and process accordingly
  
  const supabase = await createClient()
  
  const { transactionId, status } = payload

  if (!transactionId || !status) {
    throw new Error('Invalid webhook payload')
  }

  // Get transaction from database
  const { data: transaction, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('transaction_id', transactionId)
    .single()

  if (error || !transaction) {
    throw new Error('Transaction not found')
  }

  // Update transaction status
  const updateData: any = {
    status: status as PaymentStatus,
    updated_at: new Date().toISOString()
  }

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  await supabase
    .from('payment_transactions')
    .update(updateData)
    .eq('id', transaction.id)

  // If payment is completed, upgrade subscription
  if (status === 'completed' && transaction.status !== 'completed') {
    await upgradeSubscription(transaction.user_id, transactionId)
  }

  return { success: true }
}

export async function confirmPaymentCompletion(transactionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get transaction from database
  const { data: transaction, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('transaction_id', transactionId)
    .eq('user_id', user.id)
    .single()

  if (error || !transaction) {
    throw new Error('Transaction not found')
  }

  if (transaction.status === 'completed') {
    return { success: true, alreadyCompleted: true }
  }

  if (transaction.status === 'cancelled' || transaction.status === 'failed') {
    throw new Error('Cannot complete a cancelled or failed payment')
  }

  // Mark payment as completed
  await supabase
    .from('payment_transactions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.id)

  // Upgrade subscription
  try {
    await upgradeSubscription(user.id, transactionId)
  } catch (error) {
    console.error('Failed to upgrade subscription after payment:', error)
    // Don't throw - payment is still successful, subscription upgrade can be retried
  }

  return { success: true }
}
