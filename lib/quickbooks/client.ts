// QuickBooks Client - DISABLED
// This functionality is currently disabled

import { type QuickBooksTokens, type QuickBooksReport, type QuickBooksTransaction, type QuickBooksAccount } from './types'

// Re-export types for convenience
export type { QuickBooksTokens, QuickBooksReport, QuickBooksTransaction, QuickBooksAccount }

export function createQuickBooksClient(
  _accessToken: string,
  _refreshToken: string,
  _realmId: string,
  _organizationId: string
): never {
  throw new Error('QuickBooks integration is disabled')
}

export async function ensureValidToken(
  tokens: QuickBooksTokens,
  _organizationId: string
): Promise<QuickBooksTokens> {
  return tokens
}

export async function fetchProfitAndLossReport(
  _tokens: QuickBooksTokens,
  _organizationId: string,
  _startDate?: string,
  _endDate?: string
): Promise<QuickBooksReport> {
  throw new Error('QuickBooks integration is disabled')
}

export async function fetchBalanceSheetReport(
  _tokens: QuickBooksTokens,
  _organizationId: string,
  _asOfDate?: string
): Promise<QuickBooksReport> {
  throw new Error('QuickBooks integration is disabled')
}

export async function fetchTransactions(
  _tokens: QuickBooksTokens,
  _organizationId: string,
  _startDate?: string,
  _endDate?: string,
  _limit: number = 100
): Promise<QuickBooksTransaction[]> {
  throw new Error('QuickBooks integration is disabled')
}

export async function fetchAccounts(
  _tokens: QuickBooksTokens,
  _organizationId: string
): Promise<QuickBooksAccount[]> {
  throw new Error('QuickBooks integration is disabled')
}
