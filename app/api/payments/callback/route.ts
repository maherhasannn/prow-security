import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { elavonCallbackSchema } from '@/lib/payments/validation'
import { processElavonCallback } from '@/lib/payments/elavon'
import { activateSubscription, getOrganizationSubscription } from '@/lib/payments/subscription'
import { isBillingEnabled } from '@/lib/utils/env'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'
import { db } from '@/lib/db'
import { payments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/payments/callback
 * Handle redirect from Elavon after payment
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  try {
    // Check if billing is enabled
    if (!isBillingEnabled()) {
      return NextResponse.redirect(`${baseUrl}/app/billing?error=billing_disabled`)
    }

    // Get the session
    const session = await auth()
    if (!session?.user?.organizationId) {
      // User not logged in, redirect to login
      return NextResponse.redirect(`${baseUrl}/auth/signin?callbackUrl=/app/billing`)
    }

    const organizationId = session.user.organizationId

    // Parse the callback parameters
    const params = Object.fromEntries(request.nextUrl.searchParams)
    const validated = elavonCallbackSchema.parse(params)

    // Process the callback
    const result = await processElavonCallback(validated, organizationId)

    if (result.success && result.paymentId) {
      // Get the payment to find the plan details
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, result.paymentId))
        .limit(1)

      if (payment?.metadata) {
        const metadata = payment.metadata as { planId?: string; billingInterval?: 'monthly' | 'yearly' }

        if (metadata.planId && metadata.billingInterval) {
          // Activate the subscription
          await activateSubscription(
            organizationId,
            metadata.planId,
            metadata.billingInterval
          )

          await logAuditEvent({
            organizationId,
            userId: session.user.id,
            action: 'subscription_created',
            resourceType: 'subscription',
            metadata: {
              planId: metadata.planId,
              billingInterval: metadata.billingInterval,
              paymentId: result.paymentId,
            },
            ipAddress: getClientIp(request),
            userAgent: getClientUserAgent(request),
          })
        }
      }

      return NextResponse.redirect(`${baseUrl}/app/billing?success=true`)
    } else {
      // Payment failed
      const errorMessage = encodeURIComponent(result.error || 'Payment failed')
      return NextResponse.redirect(`${baseUrl}/app/billing?error=${errorMessage}`)
    }
  } catch (error) {
    console.error('Payment callback error:', error)
    const errorMessage = encodeURIComponent('An error occurred processing your payment')
    return NextResponse.redirect(`${baseUrl}/app/billing?error=${errorMessage}`)
  }
}
