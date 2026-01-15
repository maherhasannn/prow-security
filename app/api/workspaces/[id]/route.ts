import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { workspaces } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { updateWorkspaceSchema } from '@/lib/utils/validation'
import { handleError, NotFoundError, AuthorizationError } from '@/lib/utils/errors'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'
import { requireWorkspaceAccess } from '@/lib/rbac/checks'

/**
 * GET /api/workspaces/[id] - Get a specific workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.id, params.id),
          eq(workspaces.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!workspace) {
      throw new NotFoundError('Workspace')
    }

    // Verify access
    await requireWorkspaceAccess(workspace.id, organizationId, session.user.id)

    return NextResponse.json({ workspace })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * PATCH /api/workspaces/[id] - Update a workspace
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.id, params.id),
          eq(workspaces.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!workspace) {
      throw new NotFoundError('Workspace')
    }

    // Verify access
    await requireWorkspaceAccess(workspace.id, organizationId, session.user.id)

    const body = await request.json()
    const validated = updateWorkspaceSchema.parse(body)

    const [updated] = await db
      .update(workspaces)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, params.id))
      .returning()

    // Log audit event
    await logAuditEvent({
      organizationId,
      userId: session.user.id,
      action: 'workspace_update',
      resourceType: 'workspace',
      resourceId: workspace.id,
      metadata: validated,
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ workspace: updated })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * DELETE /api/workspaces/[id] - Delete a workspace
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.id, params.id),
          eq(workspaces.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!workspace) {
      throw new NotFoundError('Workspace')
    }

    // Only admins and owners can delete workspaces
    const { requireRole } = await import('@/lib/auth/middleware')
    await requireRole(organizationId, 'admin')

    await db.delete(workspaces).where(eq(workspaces.id, params.id))

    // Log audit event
    await logAuditEvent({
      organizationId,
      userId: session.user.id,
      action: 'workspace_delete',
      resourceType: 'workspace',
      resourceId: workspace.id,
      metadata: { name: workspace.name },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

