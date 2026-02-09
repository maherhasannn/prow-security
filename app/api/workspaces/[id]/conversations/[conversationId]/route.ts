import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { aiSessions, aiMessages, workspaces } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { updateAISessionSchema } from '@/lib/utils/validation'
import { handleError, NotFoundError } from '@/lib/utils/errors'

/**
 * GET /api/workspaces/[id]/conversations/[conversationId] - Get a conversation with messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; conversationId: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()
    const { id: workspaceId, conversationId } = params

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

    // Get the conversation
    const [conversation] = await db
      .select()
      .from(aiSessions)
      .where(
        and(
          eq(aiSessions.id, conversationId),
          eq(aiSessions.workspaceId, workspaceId),
          eq(aiSessions.userId, session.user.id)
        )
      )
      .limit(1)

    if (!conversation) {
      throw new NotFoundError('Conversation')
    }

    // Get all messages for this conversation
    const messages = await db
      .select({
        id: aiMessages.id,
        role: aiMessages.role,
        content: aiMessages.content,
        documentIds: aiMessages.documentIds,
        createdAt: aiMessages.createdAt,
      })
      .from(aiMessages)
      .where(eq(aiMessages.sessionId, conversationId))
      .orderBy(asc(aiMessages.createdAt))

    return NextResponse.json({
      conversation,
      messages,
    })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * PATCH /api/workspaces/[id]/conversations/[conversationId] - Update a conversation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; conversationId: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()
    const { id: workspaceId, conversationId } = params

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

    // Verify conversation exists and belongs to user
    const [existingConversation] = await db
      .select()
      .from(aiSessions)
      .where(
        and(
          eq(aiSessions.id, conversationId),
          eq(aiSessions.workspaceId, workspaceId),
          eq(aiSessions.userId, session.user.id)
        )
      )
      .limit(1)

    if (!existingConversation) {
      throw new NotFoundError('Conversation')
    }

    const body = await request.json()
    const validated = updateAISessionSchema.parse(body)

    // Update the conversation
    const [updatedConversation] = await db
      .update(aiSessions)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(aiSessions.id, conversationId))
      .returning()

    return NextResponse.json({ conversation: updatedConversation })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * DELETE /api/workspaces/[id]/conversations/[conversationId] - Delete a conversation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; conversationId: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()
    const { id: workspaceId, conversationId } = params

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

    // Verify conversation exists and belongs to user
    const [existingConversation] = await db
      .select()
      .from(aiSessions)
      .where(
        and(
          eq(aiSessions.id, conversationId),
          eq(aiSessions.workspaceId, workspaceId),
          eq(aiSessions.userId, session.user.id)
        )
      )
      .limit(1)

    if (!existingConversation) {
      throw new NotFoundError('Conversation')
    }

    // Delete the conversation (messages will cascade delete)
    await db
      .delete(aiSessions)
      .where(eq(aiSessions.id, conversationId))

    return NextResponse.json({ success: true })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
