import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserOrganizationId, requireRole } from '@/lib/auth/middleware'
import { requireBillingEnabled } from '@/lib/payments/middleware'
import {
  updateSubscriptionSchema,
  cancelSubscriptionSchema,
  selectFreePlanSchema,
} from '@/lib/payments/validation'
import {
  getOrganizationSubscription,
  cancelSubscription,
  createFreeSubscription,
  getSubscriptionPlan,
} from '@/lib/payments/subscription'
import { handleError } from '@/lib/utils/errors'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'

/**
 * GET /api/payments/subscription
 * Get the current subscription for the organization
 */
export async function GET(request: NextRequest) {
  try {
    requireBillingEnabled()
    await requireAuth()
    const organizationId = await getUserOrganizationId()

    const subscription = await getOrganizationSubscription(organizationId)

    return NextResponse.json({ subscription })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * POST /api/payments/subscription
 * Select the free plan (creates subscription without payment)
 */
export async function POST(request: NextRequest) {
  try {
    requireBillingEnabled()
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    // Only admins and owners can create subscriptions
    await requireRole(organizationId, 'admin')

    const body = await request.json()
    const validated = selectFreePlanSchema.parse(body)

    // Verify the plan is free
    const plan = await getSubscriptionPlan(validated.planId)
    if (plan.type !== 'free') {
      return NextResponse.json(
        { error: 'This endpoint is only for selecting the free plan' },
        { status: 400 }
      )
    }

    // Create the free subscription
    const subscription = await createFreeSubscription(organizationId)

    await logAuditEvent({
      organizationId,
      userId: session.user.id,
      action: 'subscription_created',
      resourceType: 'subscription',
      resourceId: subscription.id,
      metadata: {
        planId: plan.id,
        planName: plan.name,
        planType: 'free',
      },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ subscription }, { status: 201 })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * PATCH /api/payments/subscription
 * Update or cancel the subscription
 */
export async function PATCH(request: NextRequest) {
  try {
    requireBillingEnabled()
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    // Only admins and owners can modify subscriptions
    await requireRole(organizationId, 'admin')

    const body = await request.json()

    // Check if this is a cancellation request
    if (body.cancel === true) {
      const validated = cancelSubscriptionSchema.parse(body)
      const subscription = await cancelSubscription(
        organizationId,
        validated.cancelImmediately
      )

      await logAuditEvent({
        organizationId,
        userId: session.user.id,
        action: 'subscription_canceled',
        resourceType: 'subscription',
        resourceId: subscription.id,
        metadata: {
          cancelImmediately: validated.cancelImmediately,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        },
        ipAddress: getClientIp(request),
        userAgent: getClientUserAgent(request),
      })

      return NextResponse.json({ subscription })
    }

    // Regular update
    const validated = updateSubscriptionSchema.parse(body)

    // For plan changes that require payment, redirect to checkout
    if (validated.planId) {
      const plan = await getSubscriptionPlan(validated.planId)
      if (plan.type !== 'free') {
        return NextResponse.json(
          { error: 'Plan upgrades require payment. Use POST /api/payments/session' },
          { status: 400 }
        )
      }
    }

    // Handle cancel at period end toggle
    if (validated.cancelAtPeriodEnd !== undefined) {
      if (validated.cancelAtPeriodEnd) {
        const subscription = await cancelSubscription(organizationId, false)

        await logAuditEvent({
          organizationId,
          userId: session.user.id,
          action: 'subscription_updated',
          resourceType: 'subscription',
          resourceId: subscription.id,
          metadata: {
            cancelAtPeriodEnd: true,
          },
          ipAddress: getClientIp(request),
          userAgent: getClientUserAgent(request),
        })

        return NextResponse.json({ subscription })
      }
    }

    // Get current subscription and return it
    const subscription = await getOrganizationSubscription(organizationId)

    return NextResponse.json({ subscription })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
