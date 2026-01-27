import OpenAI from 'openai'
import { type AIProvider, type AIChatOptions, type AIChatResponse } from './base'
import { performWebSearch, formatSearchResultsForContext, webSearchFunctionDefinition } from '../web-search'

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

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = options.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    // If grounding/internet access is enabled, use function calling
    if (options.enableGrounding) {
      return this.chatWithWebSearch(messages, options)
    }

    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
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

  private async chatWithWebSearch(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: AIChatOptions
  ): Promise<AIChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured')
    }

    const totalUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    }

    const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [...messages]
    let iterations = 0
    const maxIterations = 5

    while (iterations < maxIterations) {
      iterations++

      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-4o',
        messages: conversationMessages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        tools: [webSearchFunctionDefinition],
        tool_choice: 'auto',
      })

      if (response.usage) {
        totalUsage.promptTokens += response.usage.prompt_tokens
        totalUsage.completionTokens += response.usage.completion_tokens
        totalUsage.totalTokens += response.usage.total_tokens
      }

      const assistantMessage = response.choices[0]?.message

      // If no tool calls, we have our final response
      if (!assistantMessage?.tool_calls || assistantMessage.tool_calls.length === 0) {
        return {
          content: assistantMessage?.content || '',
          usage: totalUsage,
        }
      }

      // Add assistant message with tool calls to conversation
      conversationMessages.push(assistantMessage)

      // Process each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.function.name === 'web_search') {
          try {
            const args = JSON.parse(toolCall.function.arguments)
            const searchResults = await performWebSearch(args.query)
            const formattedResults = formatSearchResultsForContext(searchResults)

            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: formattedResults,
            })
          } catch (searchError) {
            const errorMessage = searchError instanceof Error ? searchError.message : 'Search failed'
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: `Web search failed: ${errorMessage}`,
            })
          }
        }
      }
    }

    // If we hit max iterations, make one final call without tools to get a response
    const finalResponse = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: conversationMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
    })

    if (finalResponse.usage) {
      totalUsage.promptTokens += finalResponse.usage.prompt_tokens
      totalUsage.completionTokens += finalResponse.usage.completion_tokens
      totalUsage.totalTokens += finalResponse.usage.total_tokens
    }

    return {
      content: finalResponse.choices[0]?.message?.content || '',
      usage: totalUsage,
    }
  }

  async chatStream(
    options: AIChatOptions & { stream: true },
    onChunk: (chunk: string) => void
  ): Promise<AIChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured')
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = options.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    // If grounding/internet access is enabled, use function calling with streaming
    if (options.enableGrounding) {
      return this.chatStreamWithWebSearch(messages, options, onChunk)
    }

    const stream = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: true,
    })

    let fullContent = ''
    let usage: AIChatResponse['usage'] | undefined

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        fullContent += content
        onChunk(content)
      }

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

  private async chatStreamWithWebSearch(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: AIChatOptions,
    onChunk: (chunk: string) => void
  ): Promise<AIChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured')
    }

    const totalUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    }

    const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [...messages]
    let iterations = 0
    const maxIterations = 5
    let needsSearch = true

    // First, check if the model wants to search (non-streaming to detect tool calls)
    while (needsSearch && iterations < maxIterations) {
      iterations++

      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-4o',
        messages: conversationMessages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        tools: [webSearchFunctionDefinition],
        tool_choice: 'auto',
      })

      if (response.usage) {
        totalUsage.promptTokens += response.usage.prompt_tokens
        totalUsage.completionTokens += response.usage.completion_tokens
        totalUsage.totalTokens += response.usage.total_tokens
      }

      const assistantMessage = response.choices[0]?.message

      // If no tool calls, we're done with searching
      if (!assistantMessage?.tool_calls || assistantMessage.tool_calls.length === 0) {
        needsSearch = false
        // Add the assistant's response to conversation for the final streaming call
        if (assistantMessage?.content) {
          conversationMessages.push({
            role: 'assistant',
            content: assistantMessage.content,
          })
        }
        break
      }

      // Notify user that we're searching
      onChunk('[Searching the web...]\n\n')

      // Add assistant message with tool calls to conversation
      conversationMessages.push(assistantMessage)

      // Process each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.function.name === 'web_search') {
          try {
            const args = JSON.parse(toolCall.function.arguments)
            const searchResults = await performWebSearch(args.query)
            const formattedResults = formatSearchResultsForContext(searchResults)

            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: formattedResults,
            })
          } catch (searchError) {
            const errorMessage = searchError instanceof Error ? searchError.message : 'Search failed'
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: `Web search failed: ${errorMessage}`,
            })
          }
        }
      }
    }

    // Now stream the final response
    let fullContent = ''

    const stream = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: conversationMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        fullContent += content
        onChunk(content)
      }

      if (chunk.usage) {
        totalUsage.promptTokens += (chunk.usage.prompt_tokens || 0)
        totalUsage.completionTokens += (chunk.usage.completion_tokens || 0)
        totalUsage.totalTokens += (chunk.usage.total_tokens || 0)
      }
    }

    return {
      content: fullContent,
      usage: totalUsage,
    }
  }

  getModels(): string[] {
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
    ]
  }
}
