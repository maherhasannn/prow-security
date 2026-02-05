import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserOrganizationId, requireRole } from '@/lib/auth/middleware'
import { requireBillingEnabled } from '@/lib/payments/middleware'
import { createCheckoutSessionSchema } from '@/lib/payments/validation'
import { createHostedSession } from '@/lib/payments/elavon'
import {
  getSubscriptionPlan,
  getOrCreateBillingCustomer,
  calculatePlanPrice,
} from '@/lib/payments/subscription'
import { handleError, PaymentError } from '@/lib/utils/errors'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'

/**
 * POST /api/payments/session
 * Create a checkout session for Elavon hosted payment page
 */
export async function POST(request: NextRequest) {
  try {
    requireBillingEnabled()
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    // Only admins and owners can create payment sessions
    await requireRole(organizationId, 'admin')

    const body = await request.json()
    const validated = createCheckoutSessionSchema.parse(body)

    // Get the plan
    const plan = await getSubscriptionPlan(validated.planId)

    // Free plans don't need payment
    if (plan.type === 'free') {
      throw new PaymentError('Free plan does not require payment')
    }

    // Calculate the amount
    const amount = calculatePlanPrice(plan, validated.billingInterval)

    // Get or create billing customer
    const customer = await getOrCreateBillingCustomer(
      organizationId,
      session.user.email,
      session.user.name
    )

    // Create the hosted session
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const result = await createHostedSession({
      organizationId,
      amount,
      planId: validated.planId,
      billingInterval: validated.billingInterval,
      customerEmail: customer.email,
      customerName: customer.name || undefined,
      returnUrl: validated.returnUrl || `${baseUrl}/api/payments/callback`,
      cancelUrl: validated.cancelUrl || `${baseUrl}/app/billing?canceled=true`,
    })

    // Log the audit event
    await logAuditEvent({
      organizationId,
      userId: session.user.id,
      action: 'checkout_session_created',
      resourceType: 'payment',
      metadata: {
        planId: validated.planId,
        planName: plan.name,
        billingInterval: validated.billingInterval,
        amount,
      },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({
      sessionToken: result.sessionToken,
      hostedPageUrl: result.hostedPageUrl,
      expiresAt: result.expiresAt,
    })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
