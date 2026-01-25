import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { aiSessions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { handleError, NotFoundError } from '@/lib/utils/errors'
import { requireWorkspaceAccess } from '@/lib/rbac/checks'

/**
 * GET /api/ai/sessions/[id] - Get a specific AI session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const [aiSession] = await db
      .select()
      .from(aiSessions)
      .where(
        and(
          eq(aiSessions.id, params.id),
          eq(aiSessions.userId, session.user.id)
        )
      )
      .limit(1)

    if (!aiSession) {
      throw new NotFoundError('AI session')
    }

    // Verify workspace access
    await requireWorkspaceAccess(aiSession.workspaceId, organizationId, session.user.id)

    return NextResponse.json({ session: aiSession })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}



