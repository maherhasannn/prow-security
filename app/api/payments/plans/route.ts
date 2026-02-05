import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { requireBillingEnabled } from '@/lib/payments/middleware'
import { getSubscriptionPlans } from '@/lib/payments/subscription'
import { handleError } from '@/lib/utils/errors'

/**
 * GET /api/payments/plans
 * List all active subscription plans
 */
export async function GET(request: NextRequest) {
  try {
    requireBillingEnabled()
    await requireAuth()

    const plans = await getSubscriptionPlans()

    return NextResponse.json({ plans })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
