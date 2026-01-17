import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { GeminiProvider } from '@/lib/ai/providers/gemini'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messages, model, apiKey, workspaceId } = body

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Initialize Gemini provider with user API key
    const provider = new GeminiProvider(apiKey)

    // Call Gemini API
    const response = await provider.chat({
      messages,
      model: model || 'gemini-2.5-flash',
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
    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your Gemini API key.' },
        { status: 401 }
      )
    }

    if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return NextResponse.json(
        { error: 'API quota exceeded. Please check your Gemini API usage limits.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

