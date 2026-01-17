import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { workspaces } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { createWorkspaceSchema } from '@/lib/utils/validation'
import { handleError } from '@/lib/utils/errors'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'
import { requireRole } from '@/lib/auth/middleware'

/**
 * GET /api/workspaces - List workspaces for the user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const userWorkspaces = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.organizationId, organizationId))
      .orderBy(workspaces.createdAt)

    return NextResponse.json({ workspaces: userWorkspaces })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * POST /api/workspaces - Create a new workspace
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    // Check permission - members and above can create workspaces
    await requireRole(organizationId, 'member')

    const body = await request.json()
    const validated = createWorkspaceSchema.parse({
      ...body,
      organizationId,
    })

    // Verify organization matches user's organization
    if (validated.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Invalid organization' },
        { status: 403 }
      )
    }

    const [workspace] = await db
      .insert(workspaces)
      .values({
        organizationId: validated.organizationId,
        name: validated.name,
        description: validated.description,
        createdBy: session.user.id,
      })
      .returning()

    // Log audit event
    await logAuditEvent({
      organizationId,
      userId: session.user.id,
      action: 'workspace_create',
      resourceType: 'workspace',
      resourceId: workspace.id,
      metadata: { name: workspace.name },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ workspace }, { status: 201 })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}


