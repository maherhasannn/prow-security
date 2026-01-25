import { type AIProvider, type AIMessage, type AIChatOptions, type AIChatResponse } from './base'

export class GeminiProvider implements AIProvider {
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || null
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(options: AIChatOptions & { stream?: false }): Promise<AIChatResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured')
    }

    const model = options.model || 'gemini-2.5-flash'

    // Separate system and non-system messages
    const systemMessage = options.messages.find((m) => m.role === 'system')
    const systemInstruction = systemMessage?.content
    const nonSystemMessages = options.messages.filter((msg) => msg.role !== 'system')

    // Convert messages to Gemini format
    let contents = nonSystemMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    // Insert system instruction as initial user message if present
    // This is more compatible than using systemInstruction field (not supported in v1 for all models)
    if (systemInstruction) {
      // Always prepend system instruction as the first message
      contents = [
        {
          role: 'user' as const,
          parts: [{ text: systemInstruction }],
        },
        ...contents,
      ]
    }

    const requestBody: Record<string, unknown> = {
      contents,
    }

    if (options.enableGrounding) {
      requestBody.tools = [{ googleSearchRetrieval: {} }]
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.error?.message || `Gemini API error: ${response.statusText}`
      )
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>
        }
      }>
      usageMetadata?: {
        promptTokenCount?: number
        candidatesTokenCount?: number
        totalTokenCount?: number
      }
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated'

    return {
      content: text,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    }
  }

  async chatStream(
    options: AIChatOptions & { stream: true },
    onChunk: (chunk: string) => void
  ): Promise<AIChatResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured')
    }

    const model = options.model || 'gemini-2.5-flash'

    // Separate system and non-system messages
    const systemMessage = options.messages.find((m) => m.role === 'system')
    const systemInstruction = systemMessage?.content
    const nonSystemMessages = options.messages.filter((msg) => msg.role !== 'system')

    // Convert messages to Gemini format
    let contents = nonSystemMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    // Insert system instruction as initial user message if present
    // This is more compatible than using systemInstruction field (not supported in v1 for all models)
    if (systemInstruction) {
      // Always prepend system instruction as the first message
      contents = [
        {
          role: 'user' as const,
          parts: [{ text: systemInstruction }],
        },
        ...contents,
      ]
    }

    const requestBody: Record<string, unknown> = {
      contents,
    }

    if (options.enableGrounding) {
      requestBody.tools = [{ googleSearchRetrieval: {} }]
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:streamGenerateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.error?.message || `Gemini API error: ${response.statusText}`
      )
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let usage: AIChatResponse['usage'] | undefined

    if (!reader) {
      throw new Error('No response body')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((line) => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6)) as {
              candidates?: Array<{
                content?: {
                  parts?: Array<{ text?: string }>
                }
              }>
              usageMetadata?: {
                promptTokenCount?: number
                candidatesTokenCount?: number
                totalTokenCount?: number
              }
            }
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text

            if (text) {
              fullContent += text
              onChunk(text)
            }

            if (data.usageMetadata) {
              usage = {
                promptTokens: data.usageMetadata.promptTokenCount || 0,
                completionTokens: data.usageMetadata.candidatesTokenCount || 0,
                totalTokens: data.usageMetadata.totalTokenCount || 0,
              }
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    return {
      content: fullContent,
      usage,
    }
  }

  getModels(): string[] {
    return ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite', 'gemini-1.5-pro', 'gemini-pro']
  }
}

