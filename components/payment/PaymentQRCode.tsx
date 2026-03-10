'use client'

import { useEffect, useState, useRef } from 'react'
import { getPaymentStatus, confirmPaymentCompletion } from '@/app/actions/payment'
import type { PaymentStatus as PaymentStatusType } from '@/lib/payment/types'
import PaymentStatus from './PaymentStatus'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface PaymentQRCodeProps {
  transactionId: string
  qrCodeData: string
  expiresAt: Date
  paymentMethod: 'wechat_pay' | 'alipay'
  onPaymentComplete?: () => void
  onPaymentFailed?: () => void
}

export default function PaymentQRCode({
  transactionId,
  qrCodeData,
  expiresAt,
  paymentMethod,
  onPaymentComplete,
  onPaymentFailed
}: PaymentQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<PaymentStatusType>('pending')
  const [isExpired, setIsExpired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate QR code from data
  useEffect(() => {
    const generateQR = async () => {
      try {
        // Dynamically import qrcode for browser compatibility
        const QRCode = (await import('qrcode')).default
        const url = await QRCode.toDataURL(qrCodeData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeUrl(url)
      } catch (err) {
        console.error('Failed to generate QR code:', err)
        setError('Failed to generate QR code')
      }
    }

    generateQR()
  }, [qrCodeData])

  // Check expiration
  useEffect(() => {
    const checkExpiration = () => {
      if (new Date() > expiresAt) {
        setIsExpired(true)
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    }

    const expirationInterval = setInterval(checkExpiration, 1000)
    checkExpiration()

    return () => clearInterval(expirationInterval)
  }, [expiresAt])

  // Poll payment status (less frequently since we're waiting for manual confirmation)
  useEffect(() => {
    if (status === 'completed' || status === 'failed' || status === 'cancelled' || isExpired) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }

    const pollStatus = async () => {
      try {
        const statusResponse = await getPaymentStatus(transactionId)
        setStatus(statusResponse.status)

        if (statusResponse.status === 'completed') {
          onPaymentComplete?.()
        } else if (statusResponse.status === 'failed') {
          onPaymentFailed?.()
        }
      } catch (err) {
        console.error('Failed to check payment status:', err)
        // Don't set error for polling failures
      }
    }

    // Poll every 3 seconds (less frequent since we're waiting for user action)
    pollStatus()
    pollingIntervalRef.current = setInterval(pollStatus, 3000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [transactionId, status, isExpired, onPaymentComplete, onPaymentFailed])

  const handleConfirmPayment = async () => {
    setIsConfirming(true)
    setError(null)

    try {
      await confirmPaymentCompletion(transactionId)
      setStatus('completed')
      onPaymentComplete?.()
    } catch (err: any) {
      setError(err.message || 'Failed to confirm payment')
    } finally {
      setIsConfirming(false)
    }
  }

  const paymentMethodName = paymentMethod === 'wechat_pay' ? 'WeChat Pay' : 'Alipay'

  if (isExpired) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="text-center">
          <p className="text-sm font-bold text-rose-500 mb-2">QR Code Expired</p>
          <p className="text-xs text-slate-500">Please start a new payment</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="text-center">
          <p className="text-sm font-bold text-rose-500 mb-2">Error</p>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h3 className="text-lg font-black text-slate-900 mb-1">
          Scan with {paymentMethodName}
        </h3>
        <p className="text-xs text-slate-500">
          Open {paymentMethodName} and scan the QR code to complete payment
        </p>
      </div>

      <div className="relative">
        {qrCodeUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-lg"
          >
            <img
              src={qrCodeUrl}
              alt="Payment QR Code"
              className="w-64 h-64"
            />
          </motion.div>
        ) : (
          <div className="w-64 h-64 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        )}
      </div>

      <PaymentStatus status={status} />

      {status === 'pending' && (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-3">
              QR code expires in {Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60))} minutes
            </p>
            <p className="text-xs text-slate-500 mb-4">
              After scanning and completing payment in {paymentMethodName}, click below to confirm
            </p>
          </div>
          <button
            onClick={handleConfirmPayment}
            disabled={isConfirming}
            className="px-6 py-3 bg-[#585bf3] text-white rounded-xl text-sm font-bold hover:bg-[#585bf3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>I've completed payment</span>
              </>
            )}
          </button>
          {error && (
            <p className="text-xs text-rose-500 text-center">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
