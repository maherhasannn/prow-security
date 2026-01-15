// QuickBooks OAuth - DISABLED
// This functionality is currently disabled

import { type QuickBooksTokens } from './types'

export function createQuickBooksOAuthClient(): null {
  return null
}

export function getQuickBooksAuthUrl(_state?: string): string {
  throw new Error('QuickBooks integration is disabled')
}

export async function exchangeQuickBooksCode(
  _authCode: string,
  _realmId: string
): Promise<QuickBooksTokens> {
  throw new Error('QuickBooks integration is disabled')
}

export async function refreshQuickBooksToken(
  _refreshToken: string
): Promise<QuickBooksTokens> {
  throw new Error('QuickBooks integration is disabled')
}
