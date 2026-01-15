import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'
import { type AIProvider } from './base'

export type ProviderName = 'openai' | 'anthropic'

const providers: Map<ProviderName, AIProvider> = new Map()

// Initialize providers
if (process.env.OPENAI_API_KEY) {
  providers.set('openai', new OpenAIProvider())
}

if (process.env.ANTHROPIC_API_KEY) {
  providers.set('anthropic', new AnthropicProvider())
}

/**
 * Gets an AI provider by name
 */
export function getProvider(name: ProviderName): AIProvider {
  const provider = providers.get(name)
  if (!provider) {
    throw new Error(`Provider ${name} is not available or not configured`)
  }
  return provider
}

/**
 * Gets all available providers
 */
export function getAvailableProviders(): ProviderName[] {
  return Array.from(providers.keys())
}

/**
 * Checks if a provider is available
 */
export function isProviderAvailable(name: ProviderName): boolean {
  return providers.has(name)
}

