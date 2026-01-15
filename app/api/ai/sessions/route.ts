import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { aiSessions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { createAISessionSchema } from '@/lib/utils/validation'
import { handleError } from '@/lib/utils/errors'
import { requireWorkspaceAccess } from '@/lib/rbac/checks'
import { getProvider } from '@/lib/ai/providers'

/**
 * GET /api/ai/sessions - List AI sessions for user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const url = new URL(request.url)
    const workspaceId = url.searchParams.get('workspaceId')

    let query = db
      .select()
      .from(aiSessions)
      .where(eq(aiSessions.userId, session.user.id))

    if (workspaceId) {
      query = query.where(
        and(
          eq(aiSessions.workspaceId, workspaceId)
        )
      ) as typeof query
    }

    const sessions = await query.orderBy(aiSessions.createdAt)

    return NextResponse.json({ sessions })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * POST /api/ai/sessions - Create a new AI session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const body = await request.json()
    const validated = createAISessionSchema.parse(body)

    // Verify workspace access
    await requireWorkspaceAccess(validated.workspaceId, organizationId, session.user.id)

    // Verify provider is available
    const provider = getProvider(validated.provider)

    // Verify model is available
    const models = provider.getModels()
    if (!models.includes(validated.model)) {
      return NextResponse.json(
        { error: `Model ${validated.model} is not available for provider ${validated.provider}` },
        { status: 400 }
      )
    }

    const [aiSession] = await db
      .insert(aiSessions)
      .values({
        workspaceId: validated.workspaceId,
        userId: session.user.id,
        provider: validated.provider,
        model: validated.model,
        status: 'active',
      })
      .returning()

    return NextResponse.json({ session: aiSession }, { status: 201 })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

