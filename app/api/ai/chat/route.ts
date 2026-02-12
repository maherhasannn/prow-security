import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { workspaces, workspaceNotes, users } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { getUserOrganizationId } from '@/lib/auth/middleware'
import { OllamaProvider } from '@/lib/ai/providers/ollama'
import { OpenAIProvider } from '@/lib/ai/providers/openai'
import { generateWorkspaceNotes } from '@/lib/ai/note-generation'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if streaming is requested
    const url = new URL(request.url)
    const streamParam = url.searchParams.get('stream')
    const shouldStream = streamParam === 'true'

    const body = await request.json()
    const { messages, model, workspaceId, stream } = body

    // Support stream from body or query parameter
    const isStreaming = shouldStream || stream === true

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      )
    }

    const organizationId = await getUserOrganizationId()
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
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const isCoreMode = workspace.mode === 'core'
    console.log(`[AI Chat] Workspace mode: ${workspace.mode}, isCoreMode: ${isCoreMode}`)

    const provider = isCoreMode ? new OpenAIProvider() : new OllamaProvider()
    const defaultModel = isCoreMode ? 'gpt-4' : 'gpt-oss:120b-cloud'

    // Validate model against provider - use default if client sends wrong model for the mode
    const validOpenAIModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
    const validOllamaModels = ['gpt-oss:120b-cloud', 'qwen3-coder:480b-cloud', 'deepseek-v3.1:671b-cloud', 'llama3.3:70b-cloud', 'mistral-large:2406-cloud']

    let resolvedModel = defaultModel
    if (model) {
      if (isCoreMode && validOpenAIModels.includes(model)) {
        resolvedModel = model
      } else if (!isCoreMode && validOllamaModels.includes(model)) {
        resolvedModel = model
      } else {
        console.log(`[AI Chat] Client requested invalid model "${model}" for ${isCoreMode ? 'OpenAI' : 'Ollama'}, using default: ${defaultModel}`)
      }
    }

    console.log(`[AI Chat] Using provider: ${isCoreMode ? 'OpenAI' : 'Ollama'}, model: ${resolvedModel}`)

    const persistNotes = async (content: string) => {
      try {
        const notes = generateWorkspaceNotes(content)
        if (notes.length === 0) return

        await db.insert(workspaceNotes).values(
          notes.map((note) => ({
            workspaceId,
            content: note,
            type: 'ai-generated' as const,
            metadata: {
              source: 'ai',
              model: resolvedModel,
            },
          }))
        )
      } catch (noteError) {
        console.warn('Failed to persist AI notes:', noteError)
      }
    }

    const updateTokenUsage = async (tokensUsed: number) => {
      if (!tokensUsed || tokensUsed <= 0) return
      try {
        await db
          .update(users)
          .set({
            tokensUsed: sql`${users.tokensUsed} + ${tokensUsed}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, session.user.id))
        console.log(`[AI Chat] Updated token usage for user ${session.user.id}: +${tokensUsed} tokens`)
      } catch (tokenError) {
        console.warn('Failed to update token usage:', tokenError)
      }
    }

    // Handle streaming response
    if (isStreaming) {
      console.log('[AI Chat] Starting streaming response')
      const encoder = new TextEncoder()

      // Create a ReadableStream for streaming response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            console.log('[AI Chat] Calling provider.chatStream')
            const response = await provider.chatStream(
              {
                messages,
                model: resolvedModel,
                stream: true,
                enableGrounding: isCoreMode,
              },
              (chunk: string) => {
                // Send chunk as JSON
                const data = JSON.stringify({ chunk, done: false })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
            )

            console.log(`[AI Chat] Stream completed, content length: ${response.content.length}`)

            await persistNotes(response.content)

            // Update token usage if available
            if (response.usage?.totalTokens) {
              await updateTokenUsage(response.usage.totalTokens)
            }

            // Send final chunk with done: true
            const finalData = JSON.stringify({ chunk: '', done: true })
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
            controller.close()
          } catch (streamError) {
            console.error('[AI Chat] Stream error:', streamError)

            const errorMessage =
              streamError instanceof Error ? streamError.message : 'Unknown error occurred'

            // Send error in stream format so the client sees it
            const errorChunk = JSON.stringify({ chunk: `\n\n**Error:** ${errorMessage}`, done: false })
            controller.enqueue(encoder.encode(`data: ${errorChunk}\n\n`))

            const errorData = JSON.stringify({
              error: errorMessage,
              done: true
            })
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
    }

    // Non-streaming response (existing behavior)
    console.log('[AI Chat] Starting non-streaming response')
    const response = await provider.chat({
      messages,
      model: resolvedModel,
      enableGrounding: isCoreMode,
    })

    console.log(`[AI Chat] Response received, content length: ${response.content.length}`)

    await persistNotes(response.content)

    // Update token usage if available
    if (response.usage?.totalTokens) {
      await updateTokenUsage(response.usage.totalTokens)
    }

    return NextResponse.json({
      content: response.content,
      usage: response.usage,
    })
  } catch (error) {
    console.error('[AI Chat] Error in AI chat API:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    // Provide more specific error messages
    if (errorMessage.includes('OpenAI API key') || errorMessage.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please configure OPENAI_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    if (errorMessage.includes('SERPER_API_KEY')) {
      return NextResponse.json(
        { error: 'Web search API key not configured. Please configure SERPER_API_KEY environment variable for Core workspaces.' },
        { status: 500 }
      )
    }

    if (errorMessage.includes('Invalid OpenAI API key') || errorMessage.includes('401')) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY.' },
        { status: 401 }
      )
    }

    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return NextResponse.json(
        { error: 'API rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    if (errorMessage.includes('Ollama') || errorMessage.includes('OLLAMA')) {
      return NextResponse.json(
        { error: 'Ollama API error. Please check your OLLAMA_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
