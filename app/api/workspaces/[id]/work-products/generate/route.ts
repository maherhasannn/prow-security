import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { workspaces, workspaceNotes } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getUserOrganizationId } from '@/lib/auth/middleware'
import { generateWorkProductSchema } from '@/lib/utils/validation'
import { getWorkProductPrompt } from '@/lib/ai/work-product-generation'
import { getProvider, isProviderAvailable } from '@/lib/ai/providers'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = generateWorkProductSchema.parse(body)

    // Fetch the note
    const [note] = await db
      .select({
        id: workspaceNotes.id,
        content: workspaceNotes.content,
        title: workspaceNotes.title,
      })
      .from(workspaceNotes)
      .where(
        and(
          eq(workspaceNotes.id, validated.noteId),
          eq(workspaceNotes.workspaceId, params.id)
        )
      )
      .limit(1)

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Get the prompts for this work product type
    const { systemPrompt, userPrompt } = getWorkProductPrompt(
      validated.type,
      note.content,
      validated.additionalContext
    )

    // Determine which provider to use
    let providerName: 'gemini' | 'openai' | 'anthropic' = 'gemini'
    if (!isProviderAvailable('gemini')) {
      if (isProviderAvailable('openai')) {
        providerName = 'openai'
      } else if (isProviderAvailable('anthropic')) {
        providerName = 'anthropic'
      } else {
        return NextResponse.json(
          { error: 'No AI provider available' },
          { status: 503 }
        )
      }
    }

    const provider = getProvider(providerName)

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await provider.chatStream(
            {
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              stream: true,
              temperature: 0.7,
              maxTokens: 4000,
            },
            (chunk) => {
              const data = JSON.stringify({ content: chunk })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          )

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          const errorData = JSON.stringify({ error: 'Generation failed' })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error generating work product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
