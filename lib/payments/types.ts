// Elavon Converge API types

export type SubscriptionPlanType = 'free' | 'starter' | 'professional' | 'enterprise'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'
export type PaymentMethodType = 'credit_card' | 'debit_card' | 'ach'
export type BillingInterval = 'monthly' | 'yearly'

export interface SubscriptionPlan {
  id: string
  name: string
  type: SubscriptionPlanType
  description: string | null
  priceMonthly: number // in cents
  priceYearly: number // in cents
  maxSeats: number
  maxWorkspaces: number
  maxDocuments: number
  features: string[]
  isActive: boolean
}

export interface Subscription {
  id: string
  organizationId: string
  planId: string
  plan?: SubscriptionPlan
  status: SubscriptionStatus
  billingInterval: BillingInterval
  currentPeriodStart: Date
  currentPeriodEnd: Date
  canceledAt: Date | null
  cancelAtPeriodEnd: boolean
  trialStart: Date | null
  trialEnd: Date | null
}

export interface BillingCustomer {
  id: string
  organizationId: string
  email: string
  name: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string
}

export interface PaymentMethod {
  id: string
  organizationId: string
  type: PaymentMethodType
  cardLast4: string | null
  cardBrand: string | null
  expMonth: number | null
  expYear: number | null
  isDefault: boolean
}

export interface Payment {
  id: string
  organizationId: string
  subscriptionId: string | null
  paymentMethodId: string | null
  amount: number
  currency: string
  status: PaymentStatus
  elavonTransactionId: string | null
  elavonApprovalCode: string | null
  description: string | null
  failureReason: string | null
  refundedAmount: number
  createdAt: Date
}

// Elavon API request/response types

export interface ElavonHostedSessionInput {
  organizationId: string
  amount: number // in cents
  planId: string
  billingInterval: BillingInterval
  customerEmail: string
  customerName?: string
  returnUrl: string
  cancelUrl: string
}

export interface ElavonHostedSessionResponse {
  sessionToken: string
  hostedPageUrl: string
  expiresAt: Date
}

export interface ElavonCallbackPayload {
  ssl_txn_id?: string
  ssl_result?: string
  ssl_result_message?: string
  ssl_approval_code?: string
  ssl_token?: string
  ssl_card_number?: string
  ssl_exp_date?: string
  ssl_card_type?: string
  ssl_amount?: string
  ssl_invoice_number?: string
  ssl_token_response?: string
  errorCode?: string
  errorMessage?: string
}

export interface ElavonTokenPaymentInput {
  organizationId: string
  paymentMethodId: string
  amount: number // in cents
  description?: string
}

export interface ElavonRefundInput {
  paymentId: string
  organizationId: string
  amount?: number // in cents, optional for partial refund
}

export interface ElavonApiRequest {
  ssl_merchant_id: string
  ssl_user_id: string
  ssl_pin: string
  ssl_transaction_type: string
  ssl_amount?: string
  ssl_token?: string
  ssl_txn_id?: string
  ssl_invoice_number?: string
  ssl_card_present?: string
  ssl_show_form?: string
  ssl_result_format?: string
  [key: string]: string | undefined
}

export interface ElavonApiResponse {
  ssl_result: string
  ssl_result_message: string
  ssl_txn_id?: string
  ssl_approval_code?: string
  ssl_token?: string
  ssl_card_number?: string
  ssl_exp_date?: string
  ssl_card_type?: string
  ssl_amount?: string
  errorCode?: string
  errorMessage?: string
}

// Converge error codes
export interface ConvergeErrorMapping {
  code: string
  message: string
  userMessage: string
}

export const CONVERGE_ERROR_CODES: Record<string, ConvergeErrorMapping> = {
  '4000': { code: '4000', message: 'Invalid credentials', userMessage: 'Payment system configuration error. Please contact support.' },
  '4001': { code: '4001', message: 'Transaction not allowed', userMessage: 'This transaction is not allowed. Please contact support.' },
  '4002': { code: '4002', message: 'Card declined', userMessage: 'Your card was declined. Please try a different payment method.' },
  '4003': { code: '4003', message: 'Card expired', userMessage: 'Your card has expired. Please use a different card.' },
  '4004': { code: '4004', message: 'Insufficient funds', userMessage: 'Insufficient funds. Please try a different payment method.' },
  '4005': { code: '4005', message: 'Card number invalid', userMessage: 'Invalid card number. Please check and try again.' },
  '4006': { code: '4006', message: 'CVV mismatch', userMessage: 'Security code mismatch. Please check your CVV and try again.' },
  '4007': { code: '4007', message: 'AVS mismatch', userMessage: 'Address verification failed. Please check your billing address.' },
  '5000': { code: '5000', message: 'System error', userMessage: 'A system error occurred. Please try again later.' },
}

// Card brand detection
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'

export function detectCardBrand(cardNumber: string): CardBrand {
  const cleaned = cardNumber.replace(/\D/g, '')

  if (/^4/.test(cleaned)) return 'visa'
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard'
  if (/^3[47]/.test(cleaned)) return 'amex'
  if (/^6(?:011|5)/.test(cleaned)) return 'discover'

  return 'unknown'
}
