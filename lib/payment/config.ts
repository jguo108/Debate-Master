export type PaymentProviderMode = 'mock' | 'real'

export interface PaymentConfig {
  mode: PaymentProviderMode
  monthlyPrice: {
    amount: number
    currency: string
  }
  defaultCurrency: string
}

// Default configuration
export const defaultPaymentConfig: PaymentConfig = {
  mode: (process.env.PAYMENT_PROVIDER_MODE as PaymentProviderMode) || 'mock',
  monthlyPrice: {
    amount: 29,
    currency: 'CNY'
  },
  defaultCurrency: 'CNY'
}

export function getPaymentConfig(): PaymentConfig {
  // In client components, process.env may not be available, so default to mock
  // In server components, use the environment variable
  const mode = typeof window === 'undefined' 
    ? ((process.env.PAYMENT_PROVIDER_MODE as PaymentProviderMode) || 'mock')
    : 'mock' // Always use mock mode on client side for security
  
  return {
    ...defaultPaymentConfig,
    mode,
  }
}

export function isMockMode(): boolean {
  return getPaymentConfig().mode === 'mock'
}
