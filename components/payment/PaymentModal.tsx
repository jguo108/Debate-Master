'use client'

import { useState } from 'react'
import { X, CreditCard, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPayment } from '@/app/actions/payment'
import type { PaymentMethod } from '@/lib/payment/types'
import PaymentQRCode from './PaymentQRCode'
import { getPaymentConfig } from '@/lib/payment/config'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentComplete?: () => void
}

export default function PaymentModal({ isOpen, onClose, onPaymentComplete }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [paymentData, setPaymentData] = useState<{
    transactionId: string
    qrCodeData: string
    expiresAt: Date
    paymentMethod: PaymentMethod
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const config = getPaymentConfig()
  const price = `${config.monthlyPrice.currency === 'CNY' ? '¥' : '$'}${config.monthlyPrice.amount}`

  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    setLoading(true)
    setError(null)

    try {
      const response = await createPayment(method)
      setPaymentData({
        transactionId: response.transactionId,
        qrCodeData: response.qrCodeData || response.qrCodeUrl,
        expiresAt: new Date(response.expiresAt),
        paymentMethod: method
      })
      setSelectedMethod(method)
    } catch (err: any) {
      setError(err.message || 'Failed to create payment')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentComplete = () => {
    onPaymentComplete?.()
    // Dispatch custom event to notify sidebar and other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('subscription-updated'))
    }
    // Refresh the page to update subscription status
    router.refresh()
    // Close modal after a short delay
    setTimeout(() => {
      onClose()
      setSelectedMethod(null)
      setPaymentData(null)
    }, 2000)
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setSelectedMethod(null)
      setPaymentData(null)
      setError(null)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[40px] shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-2xl font-black text-slate-900">
              {paymentData ? 'Complete Payment' : 'Upgrade to Pro'}
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!paymentData ? (
              <>
                {/* Pricing Info */}
                <div className="text-center mb-6">
                  <div className="text-4xl font-black text-slate-900 mb-2">
                    {price}
                    <span className="text-lg text-slate-500 font-medium">/month</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Unlock all Pro features with a monthly subscription
                  </p>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => handlePaymentMethodSelect('wechat_pay')}
                    disabled={loading}
                    className="w-full p-4 border-2 border-slate-200 rounded-2xl hover:border-[#585bf3] hover:bg-[#585bf3]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-slate-900">WeChat Pay</div>
                      <div className="text-xs text-slate-500">微信支付</div>
                    </div>
                    {loading && (
                      <Loader2 className="w-5 h-5 text-[#585bf3] animate-spin" />
                    )}
                  </button>

                  <button
                    onClick={() => handlePaymentMethodSelect('alipay')}
                    disabled={loading}
                    className="w-full p-4 border-2 border-slate-200 rounded-2xl hover:border-[#585bf3] hover:bg-[#585bf3]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-slate-900">Alipay</div>
                      <div className="text-xs text-slate-500">支付宝</div>
                    </div>
                    {loading && (
                      <Loader2 className="w-5 h-5 text-[#585bf3] animate-spin" />
                    )}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-rose-100 border border-rose-200 rounded-xl mb-4">
                    <p className="text-sm text-rose-600 font-medium">{error}</p>
                  </div>
                )}

                {/* Features List */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                  <div className="font-bold text-slate-900 mb-2">Pro Features:</div>
                  <div className="space-y-1 text-slate-600">
                    <div>✓ Unlimited AI Debates</div>
                    <div>✓ Unlimited Friend Challenges</div>
                    <div>✓ All AI Models (Gemini, GPT-4o, Claude)</div>
                    <div>✓ Extended Time Limits (up to 60 min)</div>
                    <div>✓ Unlimited History</div>
                  </div>
                </div>
              </>
            ) : (
              <PaymentQRCode
                transactionId={paymentData.transactionId}
                qrCodeData={paymentData.qrCodeData}
                expiresAt={paymentData.expiresAt}
                paymentMethod={paymentData.paymentMethod}
                onPaymentComplete={handlePaymentComplete}
                onPaymentFailed={() => setError('Payment failed. Please try again.')}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
