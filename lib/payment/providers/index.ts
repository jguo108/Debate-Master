import type { PaymentMethod, PaymentProvider } from '../types'
import { MockWeChatPayProvider } from './mock-wechat-pay'
import { MockAlipayProvider } from './mock-alipay'
import { isMockMode } from '../config'

/**
 * Factory function to get the appropriate payment provider
 * This makes it easy to swap mock implementations with real ones later
 */
export function getPaymentProvider(paymentMethod: PaymentMethod): PaymentProvider {
  if (isMockMode()) {
    // Return mock providers
    switch (paymentMethod) {
      case 'wechat_pay':
        return new MockWeChatPayProvider()
      case 'alipay':
        return new MockAlipayProvider()
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`)
    }
  } else {
    // In the future, return real providers here
    // For example:
    // switch (paymentMethod) {
    //   case 'wechat_pay':
    //     return new RealWeChatPayProvider()
    //   case 'alipay':
    //     return new RealAlipayProvider()
    // }
    throw new Error('Real payment providers not yet implemented. Set PAYMENT_PROVIDER_MODE=mock')
  }
}
