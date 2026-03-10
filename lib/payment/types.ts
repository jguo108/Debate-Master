export type PaymentMethod = 'wechat_pay' | 'alipay'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface PaymentRequest {
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  metadata?: Record<string, any>
}

export interface PaymentResponse {
  transactionId: string
  qrCodeUrl: string
  qrCodeData?: string // Base64 encoded QR code data
  expiresAt: Date
  status: PaymentStatus
}

export interface PaymentStatusResponse {
  transactionId: string
  status: PaymentStatus
  amount?: number
  currency?: string
  completedAt?: Date
}

export interface WebhookPayload {
  transactionId: string
  status: PaymentStatus
  amount: number
  currency: string
  timestamp: string
  signature?: string
  metadata?: Record<string, any>
}

export interface PaymentProvider {
  /**
   * Create a new payment transaction
   */
  createPayment(request: PaymentRequest): Promise<PaymentResponse>

  /**
   * Get the current status of a payment transaction
   */
  getPaymentStatus(transactionId: string): Promise<PaymentStatusResponse>

  /**
   * Cancel a pending payment transaction
   */
  cancelPayment(transactionId: string): Promise<boolean>

  /**
   * Verify webhook authenticity (for real implementations)
   */
  verifyWebhook?(payload: WebhookPayload, signature: string): Promise<boolean>
}
