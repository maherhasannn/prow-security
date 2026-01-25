import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireOrganizationAccess } from '@/lib/auth/middleware'
import { queryAuditLogsSchema } from '@/lib/utils/validation'
import { handleError } from '@/lib/utils/errors'
import { getAuditLogs } from '@/lib/audit/logger'
import { requireRole } from '@/lib/auth/middleware'

/**
 * GET /api/organizations/[id]/audit - Get audit logs for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    await requireOrganizationAccess(params.id)

    // Only admins and owners can view audit logs
    await requireRole(params.id, 'admin')

    const url = new URL(request.url)
    const validated = queryAuditLogsSchema.parse({
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
      action: url.searchParams.get('action'),
      resourceType: url.searchParams.get('resourceType'),
      userId: url.searchParams.get('userId'),
      startDate: url.searchParams.get('startDate'),
      endDate: url.searchParams.get('endDate'),
    })

    const result = await getAuditLogs(params.id, {
      page: validated.page,
      limit: validated.limit,
      action: validated.action,
      resourceType: validated.resourceType,
      userId: validated.userId,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}



