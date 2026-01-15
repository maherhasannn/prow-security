import OAuthClient from 'intuit-oauth'
import { type QuickBooksConfig, type QuickBooksTokens } from './types'

if (!process.env.QUICKBOOKS_CLIENT_ID || !process.env.QUICKBOOKS_CLIENT_SECRET) {
  console.warn('QuickBooks OAuth credentials not set - QuickBooks integration will not be available')
}

/**
 * Creates a QuickBooks OAuth client
 */
export function createQuickBooksOAuthClient(): OAuthClient | null {
  if (!process.env.QUICKBOOKS_CLIENT_ID || !process.env.QUICKBOOKS_CLIENT_SECRET) {
    return null
  }

  return new OAuthClient({
    clientId: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
    environment: (process.env.QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || '',
  })
}

/**
 * Gets the authorization URL for QuickBooks OAuth
 */
export function getQuickBooksAuthUrl(state?: string): string {
  const client = createQuickBooksOAuthClient()
  if (!client) {
    throw new Error('QuickBooks OAuth not configured')
  }

  const authUri = client.authorizeUri({
    scope: [
      OAuthClient.scopes.Accounting,
    ],
    state: state || crypto.randomUUID(),
  })

  return authUri
}

/**
 * Exchanges authorization code for tokens
 */
export async function exchangeQuickBooksCode(
  authCode: string,
  realmId: string
): Promise<QuickBooksTokens> {
  const client = createQuickBooksOAuthClient()
  if (!client) {
    throw new Error('QuickBooks OAuth not configured')
  }

  const authResponse = await client.createToken(authCode)

  if (!authResponse.getJson()) {
    throw new Error('Failed to get tokens from QuickBooks')
  }

  const tokenData = authResponse.getJson()
  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600))

  return {
    accessToken: authResponse.getAccessToken(),
    refreshToken: authResponse.getRefreshToken(),
    expiresAt,
    realmId,
  }
}

/**
 * Refreshes QuickBooks access token
 */
export async function refreshQuickBooksToken(
  refreshToken: string
): Promise<QuickBooksTokens> {
  const client = createQuickBooksOAuthClient()
  if (!client) {
    throw new Error('QuickBooks OAuth not configured')
  }

  client.setToken({
    refresh_token: refreshToken,
  })

  const authResponse = await client.refresh()

  if (!authResponse.getJson()) {
    throw new Error('Failed to refresh QuickBooks token')
  }

  const tokenData = authResponse.getJson()
  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600))

  return {
    accessToken: authResponse.getAccessToken(),
    refreshToken: authResponse.getRefreshToken(),
    expiresAt,
    realmId: '', // Realm ID should be preserved from existing connection
  }
}

