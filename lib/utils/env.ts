import { z } from 'zod'

// Elavon environment schema
const elavonEnvSchema = z.object({
  ELAVON_MERCHANT_ID: z.string().min(1, 'ELAVON_MERCHANT_ID is required'),
  ELAVON_USER_ID: z.string().min(1, 'ELAVON_USER_ID is required'),
  ELAVON_PIN: z.string().min(1, 'ELAVON_PIN is required'),
  ELAVON_HOSTED_KEY: z.string().min(1, 'ELAVON_HOSTED_KEY is required'),
  ELAVON_API_URL: z.string().url().default('https://api.demo.convergepay.com/VirtualMerchantDemo'),
  ELAVON_HOSTED_URL: z.string().url().default('https://www.convergepay.com/hosted-payments/'),
})

// Feature flag schema
const featureFlagsSchema = z.object({
  FEATURE_BILLING_ENABLED: z.string().transform(val => val === 'true').default('false'),
})

// Combined billing environment schema
const billingEnvSchema = elavonEnvSchema.merge(featureFlagsSchema)

export type ElavonEnv = z.infer<typeof elavonEnvSchema>
export type FeatureFlags = z.infer<typeof featureFlagsSchema>
export type BillingEnv = z.infer<typeof billingEnvSchema>

// Cached parsed environment
let cachedElavonEnv: ElavonEnv | null = null
let cachedBillingEnabled: boolean | null = null

/**
 * Get Elavon configuration from environment variables.
 * Throws if billing is enabled but credentials are missing.
 */
export function getElavonEnv(): ElavonEnv {
  if (cachedElavonEnv) {
    return cachedElavonEnv
  }

  const result = elavonEnvSchema.safeParse({
    ELAVON_MERCHANT_ID: process.env.ELAVON_MERCHANT_ID,
    ELAVON_USER_ID: process.env.ELAVON_USER_ID,
    ELAVON_PIN: process.env.ELAVON_PIN,
    ELAVON_HOSTED_KEY: process.env.ELAVON_HOSTED_KEY,
    ELAVON_API_URL: process.env.ELAVON_API_URL,
    ELAVON_HOSTED_URL: process.env.ELAVON_HOSTED_URL,
  })

  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    throw new Error(`Invalid Elavon configuration: ${errors}`)
  }

  cachedElavonEnv = result.data
  return cachedElavonEnv
}

/**
 * Check if billing feature is enabled
 */
export function isBillingEnabled(): boolean {
  if (cachedBillingEnabled !== null) {
    return cachedBillingEnabled
  }

  cachedBillingEnabled = process.env.FEATURE_BILLING_ENABLED === 'true'
  return cachedBillingEnabled
}

/**
 * Check if billing is enabled on the client side
 */
export function isClientBillingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_ENABLED === 'true'
}

/**
 * Get a required environment variable or throw
 */
export function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

/**
 * Get an optional environment variable with a default
 */
export function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] ?? defaultValue
}

/**
 * Clear cached environment (useful for testing)
 */
export function clearEnvCache(): void {
  cachedElavonEnv = null
  cachedBillingEnabled = null
}
