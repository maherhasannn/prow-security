import { db } from '@/lib/db'
import {
  payments,
  paymentEvents,
  paymentMethods,
  subscriptions,
  subscriptionPlans,
  billingCustomers,
} from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { getElavonEnv } from '@/lib/utils/env'
import { PaymentError, NotFoundError } from '@/lib/utils/errors'
import {
  ElavonHostedSessionInput,
  ElavonHostedSessionResponse,
  ElavonCallbackPayload,
  ElavonTokenPaymentInput,
  ElavonRefundInput,
  ElavonApiResponse,
  CONVERGE_ERROR_CODES,
  detectCardBrand,
} from './types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Create a hosted checkout session with Elavon Converge.
 * Returns a URL to redirect the user to Elavon's hosted payment page.
 */
export async function createHostedSession(
  input: ElavonHostedSessionInput
): Promise<ElavonHostedSessionResponse> {
  const env = getElavonEnv()

  // Create a pending payment record
  const invoiceNumber = `INV-${uuidv4().slice(0, 8).toUpperCase()}`

  const [payment] = await db
    .insert(payments)
    .values({
      organizationId: input.organizationId,
      amount: input.amount,
      currency: 'USD',
      status: 'pending',
      description: `Subscription payment for plan`,
      metadata: {
        planId: input.planId,
        billingInterval: input.billingInterval,
        invoiceNumber,
      },
    })
    .returning()

  // Log the checkout initiation event
  await db.insert(paymentEvents).values({
    paymentId: payment.id,
    organizationId: input.organizationId,
    eventType: 'checkout_initiated',
    rawPayload: {
      amount: input.amount,
      planId: input.planId,
      billingInterval: input.billingInterval,
    },
  })

  // Build the hosted page URL with parameters
  const params = new URLSearchParams({
    ssl_merchant_id: env.ELAVON_MERCHANT_ID,
    ssl_user_id: env.ELAVON_USER_ID,
    ssl_pin: env.ELAVON_PIN,
    ssl_transaction_type: 'ccsale',
    ssl_amount: (input.amount / 100).toFixed(2), // Convert cents to dollars
    ssl_invoice_number: invoiceNumber,
    ssl_show_form: 'true',
    ssl_result_format: 'ASCII',
    ssl_get_token: 'Y', // Request a token for future payments
    ssl_add_token: 'Y',
    // Return URLs
    ssl_receipt_link_method: 'REDG',
    ssl_receipt_link_url: input.returnUrl,
    ssl_error_url: input.cancelUrl,
    // Customer info
    ssl_email: input.customerEmail,
    ssl_first_name: input.customerName?.split(' ')[0] || '',
    ssl_last_name: input.customerName?.split(' ').slice(1).join(' ') || '',
  })

  // The hosted page URL
  const hostedPageUrl = `${env.ELAVON_HOSTED_URL}?${params.toString()}`

  // Session expires in 30 minutes
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  return {
    sessionToken: invoiceNumber,
    hostedPageUrl,
    expiresAt,
  }
}

/**
 * Process the callback/redirect from Elavon after payment.
 * Updates the payment record and creates/updates the subscription.
 */
export async function processElavonCallback(
  payload: ElavonCallbackPayload,
  organizationId: string
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  // Find the payment by invoice number (from Elavon redirect) when present; otherwise fall back to latest pending for org
  let payment: (typeof payments.$inferSelect) | undefined

  if (payload.ssl_invoice_number) {
    const byInvoice = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          eq(payments.status, 'pending'),
          sql`${payments.metadata}->>'invoiceNumber' = ${payload.ssl_invoice_number}`
        )
      )
      .limit(1)
    payment = byInvoice[0]
  }

  if (!payment) {
    const [latestPending] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          eq(payments.status, 'pending')
        )
      )
      .orderBy(payments.createdAt)
      .limit(1)
    payment = latestPending
  }

  if (!payment) {
    return { success: false, error: 'Payment not found' }
  }

  // Log the raw callback event
  await db.insert(paymentEvents).values({
    paymentId: payment.id,
    organizationId,
    eventType: 'callback_received',
    rawPayload: payload,
  })

  // Check if payment was successful
  const isSuccess = payload.ssl_result === '0'

  if (isSuccess) {
    // Update payment record
    await db
      .update(payments)
      .set({
        status: 'completed',
        elavonTransactionId: payload.ssl_txn_id,
        elavonApprovalCode: payload.ssl_approval_code,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))

    // Save the payment token if provided
    if (payload.ssl_token) {
      await savePaymentToken(
        organizationId,
        payload.ssl_token,
        payload.ssl_card_number || '',
        payload.ssl_exp_date || '',
        payload.ssl_card_type || ''
      )
    }

    // Log success event
    await db.insert(paymentEvents).values({
      paymentId: payment.id,
      organizationId,
      eventType: 'payment_completed',
      rawPayload: {
        transactionId: payload.ssl_txn_id,
        approvalCode: payload.ssl_approval_code,
        amount: payload.ssl_amount,
      },
    })

    return { success: true, paymentId: payment.id }
  } else {
    // Payment failed
    const errorMessage = mapConvergeError(payload.errorCode || payload.ssl_result || 'unknown')

    await db
      .update(payments)
      .set({
        status: 'failed',
        failureReason: payload.ssl_result_message || errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))

    // Log failure event
    await db.insert(paymentEvents).values({
      paymentId: payment.id,
      organizationId,
      eventType: 'payment_failed',
      rawPayload: {
        result: payload.ssl_result,
        resultMessage: payload.ssl_result_message,
        errorCode: payload.errorCode,
        errorMessage: payload.errorMessage,
      },
    })

    return { success: false, paymentId: payment.id, error: errorMessage }
  }
}

/**
 * Save a tokenized payment method from Elavon.
 */
async function savePaymentToken(
  organizationId: string,
  token: string,
  cardNumber: string,
  expDate: string,
  cardType: string
): Promise<void> {
  // Get or create billing customer
  let [customer] = await db
    .select()
    .from(billingCustomers)
    .where(eq(billingCustomers.organizationId, organizationId))
    .limit(1)

  if (!customer) {
    // This shouldn't happen as customer should be created during checkout
    // but handle it gracefully
    return
  }

  // Parse card details
  const last4 = cardNumber.slice(-4)
  const cardBrand = detectCardBrand(cardNumber) || cardType?.toLowerCase() || 'unknown'
  const [expMonth, expYear] = expDate.split('/').map(Number)

  // Check if this card is already saved
  const [existingMethod] = await db
    .select()
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.organizationId, organizationId),
        eq(paymentMethods.cardLast4, last4)
      )
    )
    .limit(1)

  if (existingMethod) {
    // Update the existing method with new token
    await db
      .update(paymentMethods)
      .set({
        elavonToken: token,
        expMonth,
        expYear: expYear < 100 ? 2000 + expYear : expYear,
        updatedAt: new Date(),
      })
      .where(eq(paymentMethods.id, existingMethod.id))
  } else {
    // Check if this is the first payment method
    const existingMethods = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.organizationId, organizationId))

    const isDefault = existingMethods.length === 0

    // Create new payment method
    await db.insert(paymentMethods).values({
      organizationId,
      billingCustomerId: customer.id,
      type: 'credit_card',
      elavonToken: token,
      cardLast4: last4,
      cardBrand,
      expMonth,
      expYear: expYear < 100 ? 2000 + expYear : expYear,
      isDefault,
    })
  }
}

/**
 * Process a payment using a saved token.
 */
export async function processTokenPayment(
  input: ElavonTokenPaymentInput
): Promise<{ success: boolean; paymentId: string; error?: string }> {
  const env = getElavonEnv()

  // Get the payment method
  const [method] = await db
    .select()
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.id, input.paymentMethodId),
        eq(paymentMethods.organizationId, input.organizationId)
      )
    )
    .limit(1)

  if (!method) {
    throw new NotFoundError('Payment method')
  }

  // Create a pending payment record
  const invoiceNumber = `INV-${uuidv4().slice(0, 8).toUpperCase()}`

  const [payment] = await db
    .insert(payments)
    .values({
      organizationId: input.organizationId,
      paymentMethodId: method.id,
      amount: input.amount,
      currency: 'USD',
      status: 'processing',
      description: input.description,
      metadata: { invoiceNumber },
    })
    .returning()

  // Log the payment initiation
  await db.insert(paymentEvents).values({
    paymentId: payment.id,
    organizationId: input.organizationId,
    eventType: 'token_payment_initiated',
    rawPayload: {
      amount: input.amount,
      paymentMethodId: input.paymentMethodId,
    },
  })

  try {
    // Make the API call to Elavon
    const response = await fetch(`${env.ELAVON_API_URL}/processxml.do`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        ssl_merchant_id: env.ELAVON_MERCHANT_ID,
        ssl_user_id: env.ELAVON_USER_ID,
        ssl_pin: env.ELAVON_PIN,
        ssl_transaction_type: 'ccsale',
        ssl_token: method.elavonToken,
        ssl_amount: (input.amount / 100).toFixed(2),
        ssl_invoice_number: invoiceNumber,
        ssl_result_format: 'ASCII',
      }).toString(),
    })

    const responseText = await response.text()
    const result = parseElavonResponse(responseText)

    // Log the API response
    await db.insert(paymentEvents).values({
      paymentId: payment.id,
      organizationId: input.organizationId,
      eventType: 'api_response',
      rawPayload: result,
    })

    if (result.ssl_result === '0') {
      // Success
      await db
        .update(payments)
        .set({
          status: 'completed',
          elavonTransactionId: result.ssl_txn_id,
          elavonApprovalCode: result.ssl_approval_code,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))

      return { success: true, paymentId: payment.id }
    } else {
      // Failed
      const errorMessage = mapConvergeError(result.errorCode || result.ssl_result)

      await db
        .update(payments)
        .set({
          status: 'failed',
          failureReason: result.ssl_result_message || errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))

      return { success: false, paymentId: payment.id, error: errorMessage }
    }
  } catch (error) {
    // Network or parsing error
    await db
      .update(payments)
      .set({
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))

    await db.insert(paymentEvents).values({
      paymentId: payment.id,
      organizationId: input.organizationId,
      eventType: 'api_error',
      rawPayload: { error: error instanceof Error ? error.message : 'Unknown error' },
    })

    throw new PaymentError('Payment processing failed. Please try again.')
  }
}

/**
 * Process a refund for a completed payment.
 */
export async function processRefund(
  input: ElavonRefundInput
): Promise<{ success: boolean; refundAmount: number; error?: string }> {
  const env = getElavonEnv()

  // Get the original payment
  const [payment] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.id, input.paymentId),
        eq(payments.organizationId, input.organizationId)
      )
    )
    .limit(1)

  if (!payment) {
    throw new NotFoundError('Payment')
  }

  if (payment.status !== 'completed' && payment.status !== 'partially_refunded') {
    throw new PaymentError('Only completed payments can be refunded')
  }

  if (!payment.elavonTransactionId) {
    throw new PaymentError('Payment has no transaction ID')
  }

  // Calculate refund amount
  const maxRefundable = payment.amount - (payment.refundedAmount || 0)
  const refundAmount = input.amount ? Math.min(input.amount, maxRefundable) : maxRefundable

  if (refundAmount <= 0) {
    throw new PaymentError('Payment has already been fully refunded')
  }

  // Log the refund initiation
  await db.insert(paymentEvents).values({
    paymentId: payment.id,
    organizationId: input.organizationId,
    eventType: 'refund_initiated',
    rawPayload: { refundAmount },
  })

  try {
    // Make the refund API call
    const response = await fetch(`${env.ELAVON_API_URL}/processxml.do`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        ssl_merchant_id: env.ELAVON_MERCHANT_ID,
        ssl_user_id: env.ELAVON_USER_ID,
        ssl_pin: env.ELAVON_PIN,
        ssl_transaction_type: 'ccreturn',
        ssl_txn_id: payment.elavonTransactionId,
        ssl_amount: (refundAmount / 100).toFixed(2),
        ssl_result_format: 'ASCII',
      }).toString(),
    })

    const responseText = await response.text()
    const result = parseElavonResponse(responseText)

    // Log the API response
    await db.insert(paymentEvents).values({
      paymentId: payment.id,
      organizationId: input.organizationId,
      eventType: 'refund_api_response',
      rawPayload: result,
    })

    if (result.ssl_result === '0') {
      // Calculate new refunded amount
      const newRefundedAmount = (payment.refundedAmount || 0) + refundAmount
      const newStatus = newRefundedAmount >= payment.amount ? 'refunded' : 'partially_refunded'

      await db
        .update(payments)
        .set({
          status: newStatus,
          refundedAmount: newRefundedAmount,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))

      // Log success
      await db.insert(paymentEvents).values({
        paymentId: payment.id,
        organizationId: input.organizationId,
        eventType: 'refund_completed',
        rawPayload: {
          refundAmount,
          totalRefunded: newRefundedAmount,
          transactionId: result.ssl_txn_id,
        },
      })

      return { success: true, refundAmount }
    } else {
      const errorMessage = mapConvergeError(result.errorCode || result.ssl_result)

      // Log failure
      await db.insert(paymentEvents).values({
        paymentId: payment.id,
        organizationId: input.organizationId,
        eventType: 'refund_failed',
        rawPayload: result,
      })

      return { success: false, refundAmount: 0, error: errorMessage }
    }
  } catch (error) {
    await db.insert(paymentEvents).values({
      paymentId: payment.id,
      organizationId: input.organizationId,
      eventType: 'refund_error',
      rawPayload: { error: error instanceof Error ? error.message : 'Unknown error' },
    })

    throw new PaymentError('Refund processing failed. Please try again.')
  }
}

/**
 * Parse Elavon's ASCII response format into an object.
 */
function parseElavonResponse(responseText: string): ElavonApiResponse {
  const result: Record<string, string> = {}

  responseText.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=')
    if (key) {
      result[key.trim()] = valueParts.join('=').trim()
    }
  })

  return result as ElavonApiResponse
}

/**
 * Map Converge error codes to user-friendly messages.
 */
export function mapConvergeError(code: string | undefined): string {
  if (!code) return 'An unknown error occurred'

  const mapping = CONVERGE_ERROR_CODES[code]
  if (mapping) {
    return mapping.userMessage
  }

  // Default messages based on result code patterns
  if (code.startsWith('4')) {
    return 'Your payment could not be processed. Please try again or use a different payment method.'
  }

  if (code.startsWith('5')) {
    return 'A system error occurred. Please try again later.'
  }

  return 'Payment failed. Please try again.'
}
