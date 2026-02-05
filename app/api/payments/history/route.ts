import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { requireBillingEnabled } from '@/lib/payments/middleware'
import { queryPaymentHistorySchema } from '@/lib/payments/validation'
import { getPaymentHistory } from '@/lib/payments/subscription'
import { handleError } from '@/lib/utils/errors'

/**
 * GET /api/payments/history
 * Get paginated payment history for the organization
 */
export async function GET(request: NextRequest) {
  try {
    requireBillingEnabled()
    await requireAuth()
    const organizationId = await getUserOrganizationId()

    // Parse query parameters
    const url = new URL(request.url)
    const validated = queryPaymentHistorySchema.parse({
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
      status: url.searchParams.get('status'),
      startDate: url.searchParams.get('startDate'),
      endDate: url.searchParams.get('endDate'),
    })

    const result = await getPaymentHistory(organizationId, {
      page: validated.page,
      limit: validated.limit,
      status: validated.status,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
