import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { handleError, NotFoundError } from '@/lib/utils/errors'
import { deleteBlob } from '@/lib/storage/blob'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'
import { requireDocumentDeletePermission } from '@/lib/rbac/checks'

/**
 * GET /api/documents/[id] - Get a specific document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const [document] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, params.id),
          eq(documents.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!document) {
      throw new NotFoundError('Document')
    }

    return NextResponse.json({ document })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * DELETE /api/documents/[id] - Delete a document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const [document] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, params.id),
          eq(documents.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!document) {
      throw new NotFoundError('Document')
    }

    // Check permissions
    await requireDocumentDeletePermission(params.id, organizationId, session.user.id)

    // Delete from blob storage
    try {
      await deleteBlob(document.blobUrl)
    } catch (error) {
      console.error('Error deleting blob:', error)
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database (cascades to chunks)
    await db.delete(documents).where(eq(documents.id, params.id))

    // Log audit event
    await logAuditEvent({
      organizationId,
      userId: session.user.id,
      action: 'document_delete',
      resourceType: 'document',
      resourceId: document.id,
      metadata: { name: document.name },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}



