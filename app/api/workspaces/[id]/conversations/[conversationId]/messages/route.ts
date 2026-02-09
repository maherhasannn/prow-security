import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { aiSessions, aiMessages, workspaces } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { handleError, NotFoundError } from '@/lib/utils/errors'
import { z } from 'zod'

const saveMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  documentIds: z.array(z.string().uuid()).optional(),
})

const saveMessagesSchema = z.object({
  messages: z.array(saveMessageSchema),
})

/**
 * POST /api/workspaces/[id]/conversations/[conversationId]/messages - Save messages to a conversation
 */
export async function POST(
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

    const body = await request.json()
    const validated = saveMessagesSchema.parse(body)

    // Insert all messages
    const savedMessages = await db
      .insert(aiMessages)
      .values(
        validated.messages.map((msg) => ({
          sessionId: conversationId,
          role: msg.role,
          content: msg.content,
          documentIds: msg.documentIds || null,
        }))
      )
      .returning()

    // Update conversation title if this is the first user message and no title exists
    if (!conversation.title && validated.messages.length > 0) {
      const firstUserMessage = validated.messages.find(m => m.role === 'user')
      if (firstUserMessage) {
        // Generate a title from the first 50 characters of the first user message
        const autoTitle = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
        await db
          .update(aiSessions)
          .set({
            title: autoTitle,
            messageCount: sql`${aiSessions.messageCount} + ${validated.messages.length}`,
            updatedAt: new Date(),
          })
          .where(eq(aiSessions.id, conversationId))
      }
    } else {
      // Just update message count and timestamp
      await db
        .update(aiSessions)
        .set({
          messageCount: sql`${aiSessions.messageCount} + ${validated.messages.length}`,
          updatedAt: new Date(),
        })
        .where(eq(aiSessions.id, conversationId))
    }

    return NextResponse.json({ messages: savedMessages }, { status: 201 })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
