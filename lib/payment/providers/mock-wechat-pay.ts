import type { PaymentProvider, PaymentRequest, PaymentResponse, PaymentStatusResponse } from '../types'
import { createClient } from '@/lib/supabase/server'

/**
 * Mock WeChat Pay Provider
 * Simulates WeChat Pay payment flow with realistic delays and status updates
 * Uses database to persist transaction state across requests
 */
export class MockWeChatPayProvider implements PaymentProvider {
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const transactionId = `WX${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now

    // Generate mock QR code data (in real implementation, this would be from WeChat Pay API)
    const qrCodeData = `weixin://wxpay/bizpayurl?pr=${transactionId}`

    return {
      transactionId,
      qrCodeUrl: qrCodeData,
      qrCodeData,
      expiresAt,
      status: 'pending'
    }
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    const supabase = await createClient()
    
    // Get transaction from database
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (error || !transaction) {
      throw new Error(`Transaction ${transactionId} not found`)
    }

    // If already completed, return completed status
    if (transaction.status === 'completed') {
      return {
        transactionId,
        status: 'completed',
        amount: Number(transaction.amount),
        currency: transaction.currency,
        completedAt: transaction.completed_at ? new Date(transaction.completed_at) : undefined
      }
    }

    // Return current status - no auto-completion
    // Payment will only complete when manually confirmed by user
    let status: PaymentStatusResponse['status'] = transaction.status as PaymentStatusResponse['status']

    return {
      transactionId,
      status,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      completedAt: status === 'completed' ? new Date() : undefined
    }
  }

  async cancelPayment(transactionId: string): Promise<boolean> {
    const supabase = await createClient()
    
    // Get transaction from database
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (error || !transaction) {
      return false
    }

    if (transaction.status === 'completed') {
      return false // Cannot cancel completed payment
    }

    // Update database to mark as cancelled
    await supabase
      .from('payment_transactions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    return true
  }
}
