import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { paymentEvents, payments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateElavonIP, getRequestIP } from '@/lib/payments/middleware'
import { elavonWebhookSchema } from '@/lib/payments/validation'
import { isBillingEnabled } from '@/lib/utils/env'
import { logAuditEvent } from '@/lib/audit/logger'

/**
 * POST /api/payments/webhook
 * Receive webhook notifications from Elavon
 * Note: This endpoint does not require auth, but validates IP
 */
export async function POST(request: NextRequest) {
  try {
    // Check if billing is enabled
    if (!isBillingEnabled()) {
      return NextResponse.json(
        { error: 'Billing features are disabled' },
        { status: 503 }
      )
    }

    // Validate the request is from Elavon
    const clientIP = getRequestIP(request.headers)
    if (!validateElavonIP(clientIP)) {
      console.warn(`Webhook request from unauthorized IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Parse the webhook payload
    const body = await request.formData()
    const payload: Record<string, string> = {}

    body.forEach((value, key) => {
      payload[key] = value.toString()
    })

    const validated = elavonWebhookSchema.safeParse(payload)

    if (!validated.success) {
      console.error('Invalid webhook payload:', validated.error)
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    // Find the payment by transaction ID
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.elavonTransactionId, validated.data.ssl_txn_id))
      .limit(1)

    // Log the webhook event only when we can associate it with a valid payment (organizationId is required and must be a valid UUID)
    if (payment) {
      await db.insert(paymentEvents).values({
        paymentId: payment.id,
        organizationId: payment.organizationId,
        eventType: 'webhook_received',
        rawPayload: payload,
      })
    } else {
      console.warn(`Webhook received for unknown transaction: ${validated.data.ssl_txn_id}`)
    }

    if (!payment) {
      return NextResponse.json({ received: true })
    }

    // Process based on result
    const isSuccess = validated.data.ssl_result === '0'

    if (isSuccess && payment.status === 'processing') {
      // Update payment to completed
      await db
        .update(payments)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))

      await logAuditEvent({
        organizationId: payment.organizationId,
        action: 'payment_completed',
        resourceType: 'payment',
        resourceId: payment.id,
        metadata: {
          transactionId: validated.data.ssl_txn_id,
          amount: validated.data.ssl_amount,
          source: 'webhook',
        },
      })
    } else if (!isSuccess && payment.status !== 'failed') {
      // Update payment to failed
      await db
        .update(payments)
        .set({
          status: 'failed',
          failureReason: validated.data.ssl_result_message,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))

      await logAuditEvent({
        organizationId: payment.organizationId,
        action: 'payment_failed',
        resourceType: 'payment',
        resourceId: payment.id,
        metadata: {
          transactionId: validated.data.ssl_txn_id,
          result: validated.data.ssl_result,
          resultMessage: validated.data.ssl_result_message,
          source: 'webhook',
        },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    // Return 200 to prevent Elavon from retrying
    return NextResponse.json({ received: true, error: 'Processing error' })
  }
}
