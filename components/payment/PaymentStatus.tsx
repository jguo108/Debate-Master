'use client'

import { CheckCircle2, Loader2, XCircle, Clock } from 'lucide-react'
import type { PaymentStatus as PaymentStatusType } from '@/lib/payment/types'
import { motion, AnimatePresence } from 'framer-motion'

interface PaymentStatusProps {
  status: PaymentStatusType
  message?: string
}

export default function PaymentStatus({ status, message }: PaymentStatusProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-slate-500',
      bgColor: 'bg-slate-100',
      defaultMessage: 'Waiting for payment...'
    },
    processing: {
      icon: Loader2,
      color: 'text-[#585bf3]',
      bgColor: 'bg-[#585bf3]/10',
      defaultMessage: 'Processing payment...'
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100',
      defaultMessage: 'Payment successful!'
    },
    failed: {
      icon: XCircle,
      color: 'text-rose-500',
      bgColor: 'bg-rose-100',
      defaultMessage: 'Payment failed'
    },
    cancelled: {
      icon: XCircle,
      color: 'text-slate-500',
      bgColor: 'bg-slate-100',
      defaultMessage: 'Payment cancelled'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon
  const displayMessage = message || config.defaultMessage
  const isSpinning = status === 'processing'

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl ${config.bgColor} border border-current/20`}
      >
        <Icon
          className={`w-5 h-5 ${config.color} ${isSpinning ? 'animate-spin' : ''}`}
        />
        <span className={`text-sm font-bold ${config.color}`}>
          {displayMessage}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}
