import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { aiSessions, aiMessages, workspaces } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { createConversationSchema } from '@/lib/utils/validation'
import { handleError, NotFoundError } from '@/lib/utils/errors'

/**
 * GET /api/workspaces/[id]/conversations - List conversations for a workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()
    const workspaceId = params.id

    // Verify workspace exists and user has access
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.id, workspaceId),
          eq(workspaces.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!workspace) {
      throw new NotFoundError('Workspace')
    }

    // Get all conversations for this workspace
    const conversations = await db
      .select({
        id: aiSessions.id,
        title: aiSessions.title,
        provider: aiSessions.provider,
        model: aiSessions.model,
        status: aiSessions.status,
        messageCount: aiSessions.messageCount,
        createdAt: aiSessions.createdAt,
        updatedAt: aiSessions.updatedAt,
      })
      .from(aiSessions)
      .where(
        and(
          eq(aiSessions.workspaceId, workspaceId),
          eq(aiSessions.userId, session.user.id)
        )
      )
      .orderBy(desc(aiSessions.updatedAt))

    return NextResponse.json({ conversations })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * POST /api/workspaces/[id]/conversations - Create a new conversation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()
    const workspaceId = params.id

    // Verify workspace exists and user has access
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.id, workspaceId),
          eq(workspaces.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!workspace) {
      throw new NotFoundError('Workspace')
    }

    const body = await request.json()
    const validated = createConversationSchema.parse(body)

    // Determine provider based on workspace mode
    const provider = workspace.mode === 'core' ? 'openai' : 'ollama'
    const defaultModel = workspace.mode === 'core' ? 'gpt-4' : 'gpt-oss:120b-cloud'

    // Create the conversation (AI session)
    const [conversation] = await db
      .insert(aiSessions)
      .values({
        workspaceId,
        userId: session.user.id,
        title: validated.title || null,
        provider,
        model: validated.model || defaultModel,
        status: 'active',
        messageCount: 0,
      })
      .returning()

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
