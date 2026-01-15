import { type AIProvider, type AIMessage, type AIChatOptions, type AIChatResponse } from './base'

export class GeminiProvider implements AIProvider {
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(options: AIChatOptions & { stream?: false }): Promise<AIChatResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured')
    }

    const model = options.model || 'gemini-1.5-flash'

    // Convert messages to Gemini format
    const contents = options.messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }))

    // Add system instruction if present
    const systemMessage = options.messages.find((m) => m.role === 'system')
    const systemInstruction = systemMessage?.content

    const requestBody: Record<string, unknown> = {
      contents,
    }

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }],
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
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

    const data = await response.json()

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

    const model = options.model || 'gemini-1.5-flash'

    const contents = options.messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }))

    const systemMessage = options.messages.find((m) => m.role === 'system')
    const systemInstruction = systemMessage?.content

    const requestBody: Record<string, unknown> = {
      contents,
    }

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }],
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.apiKey}`,
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
            const data = JSON.parse(line.slice(6))
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
    return ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
  }
}

