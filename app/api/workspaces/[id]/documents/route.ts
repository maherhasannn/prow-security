import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { handleError, NotFoundError } from '@/lib/utils/errors'
import { requireWorkspaceAccess } from '@/lib/rbac/checks'

/**
 * GET /api/workspaces/[id]/documents - List documents in a workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    // Verify workspace access
    await requireWorkspaceAccess(params.id, organizationId, session.user.id)

    const workspaceDocuments = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.workspaceId, params.id),
          eq(documents.organizationId, organizationId)
        )
      )
      .orderBy(documents.createdAt)

    return NextResponse.json({ documents: workspaceDocuments })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

