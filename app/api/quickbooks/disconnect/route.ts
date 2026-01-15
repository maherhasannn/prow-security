import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { quickbooksConnections } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { handleError, NotFoundError } from '@/lib/utils/errors'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'
import { requireRole } from '@/lib/auth/middleware'

/**
 * DELETE /api/quickbooks/disconnect - Disconnect QuickBooks connection
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const url = new URL(request.url)
    const workspaceId = url.searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      )
    }

    // Only admins and owners can disconnect
    await requireRole(organizationId, 'admin')

    const [connection] = await db
      .select()
      .from(quickbooksConnections)
      .where(
        and(
          eq(quickbooksConnections.workspaceId, workspaceId),
          eq(quickbooksConnections.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!connection) {
      throw new NotFoundError('QuickBooks connection')
    }

    await db.delete(quickbooksConnections).where(eq(quickbooksConnections.id, connection.id))

    // Log audit event
    await logAuditEvent({
      organizationId,
      userId: session.user.id,
      action: 'quickbooks_disconnect',
      resourceType: 'quickbooks_connection',
      resourceId: connection.id,
      metadata: { workspaceId },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

