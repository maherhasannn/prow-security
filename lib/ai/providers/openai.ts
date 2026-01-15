import OpenAI from 'openai'
import { type AIProvider, type AIMessage, type AIChatOptions, type AIChatResponse } from './base'

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not set - OpenAI provider will not be available')
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI | null = null

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }
  }

  async chat(options: AIChatOptions & { stream?: false }): Promise<AIChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4-turbo-preview',
      messages: options.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      // Explicitly disable training on user data
      extra_body: {
        training: false,
      },
    })

    const message = response.choices[0]?.message?.content || ''

    return {
      content: message,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    }
  }

  async chatStream(
    options: AIChatOptions & { stream: true },
    onChunk: (chunk: string) => void
  ): Promise<AIChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured')
    }

    const stream = await this.client.chat.completions.create({
      model: options.model || 'gpt-4-turbo-preview',
      messages: options.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: true,
      // Explicitly disable training on user data
      extra_body: {
        training: false,
      },
    })

    let fullContent = ''
    let usage: AIChatResponse['usage'] | undefined

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        fullContent += content
        onChunk(content)
      }

      // Capture usage if available
      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.prompt_tokens || 0,
          completionTokens: chunk.usage.completion_tokens || 0,
          totalTokens: chunk.usage.total_tokens || 0,
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
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-3.5-turbo',
    ]
  }
}

