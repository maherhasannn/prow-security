import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { OllamaProvider } from '@/lib/ai/providers/ollama'

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

    // Initialize Ollama provider with server-side API key from environment
    const provider = new OllamaProvider()

    // Handle streaming response
    if (isStreaming) {
      const encoder = new TextEncoder()
      
      // Create a ReadableStream for streaming response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await provider.chatStream(
              {
                messages,
                model: model || 'gpt-oss:120b-cloud',
                stream: true,
              },
              (chunk: string) => {
                // Send chunk as JSON
                const data = JSON.stringify({ chunk, done: false })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
            )
            
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
      model: model || 'gpt-oss:120b-cloud',
    })

    return NextResponse.json({
      content: response.content,
      usage: response.usage,
    })
  } catch (error) {
    console.error('Error in AI chat API:', error)
    
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    
    // Provide more specific error messages
    if (errorMessage.includes('API key') || errorMessage.includes('not configured')) {
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

