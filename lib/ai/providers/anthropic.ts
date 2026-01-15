import Anthropic from '@anthropic-ai/sdk'
import { type AIProvider, type AIMessage, type AIChatOptions, type AIChatResponse } from './base'

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('ANTHROPIC_API_KEY not set - Anthropic provider will not be available')
}

export class AnthropicProvider implements AIProvider {
  private client: Anthropic | null = null

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })
    }
  }

  async chat(options: AIChatOptions & { stream?: false }): Promise<AIChatResponse> {
    if (!this.client) {
      throw new Error('Anthropic API key not configured')
    }

    // Convert messages format for Anthropic
    const systemMessage = options.messages.find((m) => m.role === 'system')
    const userMessages = options.messages.filter((m) => m.role !== 'system')

    const response = await this.client.messages.create({
      model: options.model || 'claude-3-opus-20240229',
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      system: systemMessage?.content,
      messages: userMessages.map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
    })

    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { text: string }).text)
      .join('')

    return {
      content,
      usage: response.usage
        ? {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          }
        : undefined,
    }
  }

  async chatStream(
    options: AIChatOptions & { stream: true },
    onChunk: (chunk: string) => void
  ): Promise<AIChatResponse> {
    if (!this.client) {
      throw new Error('Anthropic API key not configured')
    }

    const systemMessage = options.messages.find((m) => m.role === 'system')
    const userMessages = options.messages.filter((m) => m.role !== 'system')

    const stream = await this.client.messages.stream({
      model: options.model || 'claude-3-opus-20240229',
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      system: systemMessage?.content,
      messages: userMessages.map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
    })

    let fullContent = ''

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text
        fullContent += text
        onChunk(text)
      }
    }

    // Note: Usage information is not easily accessible from Anthropic streaming responses
    // For usage tracking, use the non-streaming chat method instead
    return {
      content: fullContent,
      usage: undefined,
    }
  }

  getModels(): string[] {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ]
  }
}

