import { type AIProvider, type AIMessage, type AIChatOptions, type AIChatResponse } from './base'

export class OllamaProvider implements AIProvider {
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    // Use provided API key or fall back to environment variable
    this.apiKey = apiKey || process.env.OLLAMA_API_KEY || null
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(options: AIChatOptions & { stream?: false }): Promise<AIChatResponse> {
    if (!this.apiKey) {
      throw new Error('Ollama API key not configured')
    }

    const model = options.model || 'gpt-oss:120b-cloud'

    // Convert messages to Ollama format
    // Ollama supports standard role/content format with system, user, assistant roles
    const messages = options.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    const requestBody = {
      model,
      messages,
      stream: false,
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.maxTokens !== undefined && { num_predict: options.maxTokens }),
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    }

    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.error?.message || `Ollama API error: ${response.statusText}`
      )
    }

    const data = (await response.json()) as {
      message?: {
        content?: string
        role?: string
      }
      done?: boolean
      eval_count?: number
      prompt_eval_count?: number
      total_duration?: number
    }

    const content = data.message?.content || 'No response generated'

    // Ollama may not always provide usage metadata in non-streaming responses
    // We'll calculate if available
    const usage =
      data.eval_count !== undefined && data.prompt_eval_count !== undefined
        ? {
            promptTokens: data.prompt_eval_count || 0,
            completionTokens: data.eval_count || 0,
            totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
          }
        : undefined

    return {
      content,
      usage,
    }
  }

  async chatStream(
    options: AIChatOptions & { stream: true },
    onChunk: (chunk: string) => void
  ): Promise<AIChatResponse> {
    if (!this.apiKey) {
      throw new Error('Ollama API key not configured')
    }

    const model = options.model || 'gpt-oss:120b-cloud'

    // Convert messages to Ollama format
    const messages = options.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    const requestBody = {
      model,
      messages,
      stream: true,
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.maxTokens !== undefined && { num_predict: options.maxTokens }),
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    }

    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.error?.message || `Ollama API error: ${response.statusText}`
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
        if (line.trim()) {
          try {
            const data = JSON.parse(line) as {
              message?: {
                content?: string
                role?: string
              }
              done?: boolean
              eval_count?: number
              prompt_eval_count?: number
            }

            // Accumulate content from message
            const text = data.message?.content
            if (text) {
              fullContent += text
              onChunk(text)
            }

            // Capture usage metadata if available in final chunk
            if (data.done && data.eval_count !== undefined && data.prompt_eval_count !== undefined) {
              usage = {
                promptTokens: data.prompt_eval_count || 0,
                completionTokens: data.eval_count || 0,
                totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
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
    return [
      'gpt-oss:120b-cloud',
      'qwen3-coder:480b-cloud',
      'deepseek-v3.1:671b-cloud',
      'llama3.3:70b-cloud',
      'mistral-large:2406-cloud',
    ]
  }
}


