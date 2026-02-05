import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { paymentMethods } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { requireBillingEnabled } from '@/lib/payments/middleware'
import { handleError } from '@/lib/utils/errors'

/**
 * GET /api/payments/methods
 * List all saved payment methods for the organization
 */
export async function GET(request: NextRequest) {
  try {
    requireBillingEnabled()
    await requireAuth()
    const organizationId = await getUserOrganizationId()

    const methods = await db
      .select({
        id: paymentMethods.id,
        type: paymentMethods.type,
        cardLast4: paymentMethods.cardLast4,
        cardBrand: paymentMethods.cardBrand,
        expMonth: paymentMethods.expMonth,
        expYear: paymentMethods.expYear,
        isDefault: paymentMethods.isDefault,
        createdAt: paymentMethods.createdAt,
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.organizationId, organizationId))
      .orderBy(paymentMethods.createdAt)

    return NextResponse.json({ methods })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
