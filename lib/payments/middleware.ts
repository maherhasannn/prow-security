import { isBillingEnabled } from '@/lib/utils/env'
import { ServiceUnavailableError } from '@/lib/utils/errors'

/**
 * Middleware to check if billing feature is enabled.
 * Throws ServiceUnavailableError if billing is disabled.
 */
export function requireBillingEnabled(): void {
  if (!isBillingEnabled()) {
    throw new ServiceUnavailableError('Billing features are currently disabled')
  }
}

/**
 * List of allowed IP ranges for Elavon webhooks (demo and production).
 * In production, you should verify these with Elavon's documentation.
 */
const ELAVON_IP_RANGES = [
  // Demo/Sandbox
  '198.241.162.',
  '198.241.163.',
  // Production - these should be verified with Elavon
  '64.207.224.',
  '64.207.225.',
  '64.207.226.',
  '64.207.227.',
  // Allow localhost for development
  '127.0.0.1',
  '::1',
]

/**
 * Validate that the request is coming from an Elavon IP address.
 * Returns true if valid, false otherwise.
 */
export function validateElavonIP(ip: string | null): boolean {
  if (!ip) return false

  // In development, allow all IPs
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // Check if IP starts with any allowed prefix
  return ELAVON_IP_RANGES.some((prefix) => ip.startsWith(prefix))
}

/**
 * Extract IP address from request headers.
 */
export function getRequestIP(headers: Headers): string | null {
  // Check various headers that might contain the real IP
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  return null
}
