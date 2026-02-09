import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'
import { GeminiProvider } from './gemini'
import { OllamaProvider } from './ollama'
import { type AIProvider } from './base'

export type ProviderName = 'openai' | 'anthropic' | 'gemini' | 'ollama'

const providers: Map<ProviderName, AIProvider> = new Map()

// Initialize providers
if (process.env.OPENAI_API_KEY) {
  providers.set('openai', new OpenAIProvider())
}

if (process.env.ANTHROPIC_API_KEY) {
  providers.set('anthropic', new AnthropicProvider())
}

if (process.env.GEMINI_API_KEY) {
  providers.set('gemini', new GeminiProvider())
}

if (process.env.OLLAMA_API_KEY || process.env.OLLAMA_BASE_URL) {
  providers.set('ollama', new OllamaProvider())
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



