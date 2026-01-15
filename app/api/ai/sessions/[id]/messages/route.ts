import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { aiSessions, aiMessages, workspaces } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { sendAIMessageSchema } from '@/lib/utils/validation'
import { handleError, NotFoundError } from '@/lib/utils/errors'
import { requireWorkspaceAccess } from '@/lib/rbac/checks'
import { getProvider } from '@/lib/ai/providers'
import { buildAIMessages } from '@/lib/ai/context'
import { encrypt } from '@/lib/storage/encryption'
import { applyGuardrails } from '@/lib/ai/guardrails'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'

/**
 * GET /api/ai/sessions/[id]/messages - Get messages for a session
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

    const messages = await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.sessionId, params.id))
      .orderBy(aiMessages.createdAt)

    return NextResponse.json({ messages })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * POST /api/ai/sessions/[id]/messages - Send a message and get AI response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const [aiSession] = await db
      .select({
        session: aiSessions,
        workspace: workspaces,
      })
      .from(aiSessions)
      .innerJoin(workspaces, eq(aiSessions.workspaceId, workspaces.id))
      .where(
        and(
          eq(aiSessions.id, params.id),
          eq(aiSessions.userId, session.user.id),
          eq(workspaces.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!aiSession) {
      throw new NotFoundError('AI session')
    }

    // Verify workspace access
    await requireWorkspaceAccess(aiSession.session.workspaceId, organizationId, session.user.id)

    const body = await request.json()
    const validated = sendAIMessageSchema.parse(body)

    // Get AI provider
    const provider = getProvider(aiSession.session.provider as 'openai' | 'anthropic')

    // Build messages with context
    const messages = await buildAIMessages(
      validated.content,
      aiSession.session.workspaceId,
      organizationId,
      validated.documentIds
    )

    // Store user message (encrypted)
    const encryptedUserMessage = encrypt(validated.content, organizationId)
    await db.insert(aiMessages).values({
      sessionId: params.id,
      role: 'user',
      content: JSON.stringify(encryptedUserMessage),
      documentIds: validated.documentIds,
    })

    // Get AI response
    const response = await provider.chat({
      messages,
      model: aiSession.session.model,
    })

    // Apply guardrails
    const guardedResponse = applyGuardrails(response.content)

    // Store AI response (encrypted)
    const encryptedResponse = encrypt(guardedResponse, organizationId)
    await db.insert(aiMessages).values({
      sessionId: params.id,
      role: 'assistant',
      content: JSON.stringify(encryptedResponse),
    })

    // Update session
    await db
      .update(aiSessions)
      .set({ updatedAt: new Date() })
      .where(eq(aiSessions.id, params.id))

    // Log audit event
    await logAuditEvent({
      organizationId,
      userId: session.user.id,
      action: 'ai_query',
      resourceType: 'ai_session',
      resourceId: params.id,
      metadata: {
        provider: aiSession.session.provider,
        model: aiSession.session.model,
        documentIds: validated.documentIds,
      },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: guardedResponse,
      },
      usage: response.usage,
    })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

