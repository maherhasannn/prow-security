export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIChatOptions {
  messages: AIMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  enableGrounding?: boolean
}

export interface AIChatResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIProvider {
  /**
   * Chat completion (non-streaming)
   */
  chat(options: AIChatOptions & { stream?: false }): Promise<AIChatResponse>

  /**
   * Chat completion (streaming)
   */
  chatStream(
    options: AIChatOptions & { stream: true },
    onChunk: (chunk: string) => void
  ): Promise<AIChatResponse>

  /**
   * Get available models
   */
  getModels(): string[]
}

