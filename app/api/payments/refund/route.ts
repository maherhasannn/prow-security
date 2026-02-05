import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserOrganizationId, requireRole } from '@/lib/auth/middleware'
import { requireBillingEnabled } from '@/lib/payments/middleware'
import { processRefundSchema } from '@/lib/payments/validation'
import { processRefund } from '@/lib/payments/elavon'
import { handleError } from '@/lib/utils/errors'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'

/**
 * POST /api/payments/refund
 * Process a refund for a payment
 */
export async function POST(request: NextRequest) {
  try {
    requireBillingEnabled()
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    // Only owners can process refunds
    await requireRole(organizationId, 'owner')

    const body = await request.json()
    const validated = processRefundSchema.parse(body)

    const result = await processRefund({
      paymentId: validated.paymentId,
      organizationId,
      amount: validated.amount,
    })

    if (result.success) {
      await logAuditEvent({
        organizationId,
        userId: session.user.id,
        action: 'payment_refunded',
        resourceType: 'payment',
        resourceId: validated.paymentId,
        metadata: {
          refundAmount: result.refundAmount,
          reason: validated.reason,
        },
        ipAddress: getClientIp(request),
        userAgent: getClientUserAgent(request),
      })

      return NextResponse.json({
        success: true,
        refundAmount: result.refundAmount,
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Refund failed' },
        { status: 400 }
      )
    }
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
