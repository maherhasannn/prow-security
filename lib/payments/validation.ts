import { z } from 'zod'

// Subscription plan types
export const subscriptionPlanTypes = ['free', 'starter', 'professional', 'enterprise'] as const
export const billingIntervals = ['monthly', 'yearly'] as const

// Create checkout session
export const createCheckoutSessionSchema = z.object({
  planId: z.string().uuid(),
  billingInterval: z.enum(billingIntervals),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>

// Elavon callback query params
export const elavonCallbackSchema = z.object({
  ssl_txn_id: z.string().optional(),
  ssl_result: z.string().optional(),
  ssl_result_message: z.string().optional(),
  ssl_approval_code: z.string().optional(),
  ssl_token: z.string().optional(),
  ssl_card_number: z.string().optional(),
  ssl_exp_date: z.string().optional(),
  ssl_card_type: z.string().optional(),
  ssl_amount: z.string().optional(),
  ssl_invoice_number: z.string().optional(),
  ssl_token_response: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
})

export type ElavonCallbackInput = z.infer<typeof elavonCallbackSchema>

// Webhook payload (from Elavon)
export const elavonWebhookSchema = z.object({
  ssl_txn_id: z.string(),
  ssl_result: z.string(),
  ssl_result_message: z.string().optional(),
  ssl_approval_code: z.string().optional(),
  ssl_amount: z.string().optional(),
  ssl_invoice_number: z.string().optional(),
})

export type ElavonWebhookInput = z.infer<typeof elavonWebhookSchema>

// Update subscription
export const updateSubscriptionSchema = z.object({
  planId: z.string().uuid().optional(),
  billingInterval: z.enum(billingIntervals).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
})

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>

// Cancel subscription
export const cancelSubscriptionSchema = z.object({
  cancelImmediately: z.boolean().default(false),
})

export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>

// Process refund
export const processRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().int().positive().optional(), // in cents, optional for full refund
  reason: z.string().max(500).optional(),
})

export type ProcessRefundInput = z.infer<typeof processRefundSchema>

// Update payment method
export const updatePaymentMethodSchema = z.object({
  isDefault: z.boolean().optional(),
})

export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>

// Query payment history
export const queryPaymentHistorySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export type QueryPaymentHistoryInput = z.infer<typeof queryPaymentHistorySchema>

// Create billing customer
export const createBillingCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().max(255).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).default('US'),
})

export type CreateBillingCustomerInput = z.infer<typeof createBillingCustomerSchema>

// Update billing customer
export const updateBillingCustomerSchema = createBillingCustomerSchema.partial()

export type UpdateBillingCustomerInput = z.infer<typeof updateBillingCustomerSchema>

// Select free plan (bypass payment)
export const selectFreePlanSchema = z.object({
  planId: z.string().uuid(),
})

export type SelectFreePlanInput = z.infer<typeof selectFreePlanSchema>
