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
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.')
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = options.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // If grounding/internet access is enabled, use function calling
      if (options.enableGrounding) {
        return await this.chatWithWebSearch(messages, options)
      }

      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-4',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
      })

      const message = response.choices[0]?.message?.content || ''

      if (!message && response.choices[0]?.finish_reason !== 'stop') {
        console.error('OpenAI returned empty response:', JSON.stringify(response, null, 2))
        throw new Error('OpenAI returned an empty response. Please try again.')
      }

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
    } catch (error) {
      console.error('OpenAI chat error:', error)

      if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY.')
        }
        if (error.status === 429) {
          throw new Error('OpenAI rate limit exceeded. Please try again later.')
        }
        if (error.status === 500 || error.status === 503) {
          throw new Error('OpenAI service is temporarily unavailable. Please try again.')
        }
        throw new Error(`OpenAI API error: ${error.message}`)
      }

      throw error
    }
  }

  private async chatWithWebSearch(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: AIChatOptions
  ): Promise<AIChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.')
    }

    const totalUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    }

    const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [...messages]
    let iterations = 0
    const maxIterations = 5

    try {
      while (iterations < maxIterations) {
        iterations++
        console.log(`[OpenAI] Web search iteration ${iterations}`)

        const response = await this.client.chat.completions.create({
          model: options.model || 'gpt-4',
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

        if (!assistantMessage) {
          console.error('OpenAI returned no message:', JSON.stringify(response, null, 2))
          throw new Error('OpenAI returned no message in response.')
        }

        // If no tool calls, we have our final response
        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
          const content = assistantMessage.content || ''
          console.log(`[OpenAI] Final response received, length: ${content.length}`)

          return {
            content,
            usage: totalUsage,
          }
        }

        console.log(`[OpenAI] Processing ${assistantMessage.tool_calls.length} tool calls`)

        // Add assistant message with tool calls to conversation
        conversationMessages.push(assistantMessage)

        // Process each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.function.name === 'web_search') {
            try {
              const args = JSON.parse(toolCall.function.arguments)
              console.log(`[OpenAI] Executing web search: "${args.query}"`)

              const searchResults = await performWebSearch(args.query)
              const formattedResults = formatSearchResultsForContext(searchResults)

              console.log(`[OpenAI] Search returned ${searchResults.results.length} results`)

              conversationMessages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: formattedResults,
              })
            } catch (searchError) {
              const errorMessage = searchError instanceof Error ? searchError.message : 'Search failed'
              console.error(`[OpenAI] Web search failed:`, searchError)

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
      console.log('[OpenAI] Max iterations reached, making final call without tools')

      const finalResponse = await this.client.chat.completions.create({
        model: options.model || 'gpt-4',
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
    } catch (error) {
      console.error('[OpenAI] chatWithWebSearch error:', error)

      if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY.')
        }
        if (error.status === 429) {
          throw new Error('OpenAI rate limit exceeded. Please try again later.')
        }
        throw new Error(`OpenAI API error: ${error.message}`)
      }

      throw error
    }
  }

  async chatStream(
    options: AIChatOptions & { stream: true },
    onChunk: (chunk: string) => void
  ): Promise<AIChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.')
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = options.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // If grounding/internet access is enabled, use function calling with streaming
      if (options.enableGrounding) {
        return await this.chatStreamWithWebSearch(messages, options, onChunk)
      }

      const stream = await this.client.chat.completions.create({
        model: options.model || 'gpt-4',
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

      if (!fullContent) {
        console.warn('[OpenAI] Stream completed with empty content')
      }

      return {
        content: fullContent,
        usage,
      }
    } catch (error) {
      console.error('[OpenAI] chatStream error:', error)

      if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY.')
        }
        if (error.status === 429) {
          throw new Error('OpenAI rate limit exceeded. Please try again later.')
        }
        throw new Error(`OpenAI API error: ${error.message}`)
      }

      throw error
    }
  }

  private async chatStreamWithWebSearch(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: AIChatOptions,
    onChunk: (chunk: string) => void
  ): Promise<AIChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.')
    }

    const totalUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    }

    const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [...messages]
    let iterations = 0
    const maxIterations = 5

    try {
      // Process tool calls in a loop (non-streaming for tool detection)
      while (iterations < maxIterations) {
        iterations++
        console.log(`[OpenAI Stream] Iteration ${iterations}`)

        const response = await this.client.chat.completions.create({
          model: options.model || 'gpt-4',
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

        if (!assistantMessage) {
          console.error('[OpenAI Stream] No message in response:', JSON.stringify(response, null, 2))
          throw new Error('OpenAI returned no message in response.')
        }

        // If no tool calls, break out to stream the response
        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
          console.log('[OpenAI Stream] No tool calls, proceeding to stream response')
          break
        }

        // Notify user that we're searching
        onChunk('[Searching the web...]\n\n')
        console.log(`[OpenAI Stream] Processing ${assistantMessage.tool_calls.length} tool calls`)

        // Add assistant message with tool calls to conversation
        conversationMessages.push(assistantMessage)

        // Process each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.function.name === 'web_search') {
            try {
              const args = JSON.parse(toolCall.function.arguments)
              console.log(`[OpenAI Stream] Executing web search: "${args.query}"`)

              const searchResults = await performWebSearch(args.query)
              const formattedResults = formatSearchResultsForContext(searchResults)

              console.log(`[OpenAI Stream] Search returned ${searchResults.results.length} results`)

              conversationMessages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: formattedResults,
              })
            } catch (searchError) {
              const errorMessage = searchError instanceof Error ? searchError.message : 'Search failed'
              console.error(`[OpenAI Stream] Web search failed:`, searchError)

              // Send error to user
              onChunk(`[Search error: ${errorMessage}]\n\n`)

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
      console.log('[OpenAI Stream] Starting final streaming response')
      let fullContent = ''

      const stream = await this.client.chat.completions.create({
        model: options.model || 'gpt-4',
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

      console.log(`[OpenAI Stream] Stream complete, total length: ${fullContent.length}`)

      if (!fullContent) {
        console.warn('[OpenAI Stream] Stream completed with empty content')
        // Return a user-friendly message instead of blank
        return {
          content: 'I was unable to generate a response. Please try again.',
          usage: totalUsage,
        }
      }

      return {
        content: fullContent,
        usage: totalUsage,
      }
    } catch (error) {
      console.error('[OpenAI Stream] chatStreamWithWebSearch error:', error)

      if (error instanceof OpenAI.APIError) {
        const errorMsg = `OpenAI error: ${error.message}`
        onChunk(`\n\n[Error: ${errorMsg}]`)

        if (error.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY.')
        }
        if (error.status === 429) {
          throw new Error('OpenAI rate limit exceeded. Please try again later.')
        }
        throw new Error(`OpenAI API error: ${error.message}`)
      }

      // For any other error, try to send something to the user
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      onChunk(`\n\n[Error: ${errorMsg}]`)

      throw error
    }
  }

  getModels(): string[] {
    return [
      'gpt-4',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
    ]
  }
}
