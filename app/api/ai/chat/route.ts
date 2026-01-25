import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { workspaces, workspaceNotes } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getUserOrganizationId } from '@/lib/auth/middleware'
import { OllamaProvider } from '@/lib/ai/providers/ollama'
import { GeminiProvider } from '@/lib/ai/providers/gemini'
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

    const isInternetEnabled = workspace.mode === 'internet-enabled'
    const provider = isInternetEnabled ? new GeminiProvider() : new OllamaProvider()
    const defaultModel = isInternetEnabled ? 'gemini-2.5-flash' : 'gpt-oss:120b-cloud'
    const resolvedModel = model || defaultModel

    const persistNotes = async (content: string) => {
      try {
        const notes = generateWorkspaceNotes(content)
        if (notes.length === 0) return

        await db.insert(workspaceNotes).values(
          notes.map((note) => ({
            workspaceId,
            content: note,
            type: 'ai-generated',
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

    // Handle streaming response
    if (isStreaming) {
      const encoder = new TextEncoder()
      
      // Create a ReadableStream for streaming response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const response = await provider.chatStream(
              {
                messages,
                model: resolvedModel,
                stream: true,
                enableGrounding: isInternetEnabled,
              },
              (chunk: string) => {
                // Send chunk as JSON
                const data = JSON.stringify({ chunk, done: false })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
            )

            await persistNotes(response.content)
            
            // Send final chunk with done: true
            const finalData = JSON.stringify({ chunk: '', done: true })
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
            controller.close()
          } catch (streamError) {
            const errorMessage =
              streamError instanceof Error ? streamError.message : 'Unknown error occurred'
            
            // Send error in stream format
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
    const response = await provider.chat({
      messages,
      model: resolvedModel,
      enableGrounding: isInternetEnabled,
    })

    await persistNotes(response.content)

    return NextResponse.json({
      content: response.content,
      usage: response.usage,
    })
  } catch (error) {
    console.error('Error in AI chat API:', error)
    
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    
    // Provide more specific error messages
    if (errorMessage.includes('Gemini API key')) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please configure GEMINI_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    if (errorMessage.includes('Ollama API key') || errorMessage.includes('not configured')) {
      return NextResponse.json(
        { error: 'Ollama API key not configured. Please configure OLLAMA_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return NextResponse.json(
        { error: 'API quota exceeded. Please check your Ollama API usage limits.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

