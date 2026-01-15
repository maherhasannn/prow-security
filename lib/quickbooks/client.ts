import QuickBooks from 'node-quickbooks'
import { decrypt, encrypt } from '@/lib/storage/encryption'
import { type QuickBooksTokens, type QuickBooksReport, type QuickBooksTransaction, type QuickBooksAccount } from './types'
import { refreshQuickBooksToken } from './oauth'

// Re-export types for convenience
export type { QuickBooksTokens, QuickBooksReport, QuickBooksTransaction, QuickBooksAccount }

/**
 * Creates a QuickBooks API client
 */
export function createQuickBooksClient(
  accessToken: string,
  refreshToken: string,
  realmId: string,
  organizationId: string
): QuickBooks {
  if (!process.env.QUICKBOOKS_CLIENT_ID || !process.env.QUICKBOOKS_CLIENT_SECRET) {
    throw new Error('QuickBooks not configured')
  }

  const isSandbox = (process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox') === 'sandbox'

  return new QuickBooks(
    process.env.QUICKBOOKS_CLIENT_ID,
    process.env.QUICKBOOKS_CLIENT_SECRET,
    accessToken,
    isSandbox,
    realmId,
    true, // enable logging
    true, // enable debug
    null, // minor version
    '2.0', // oauth version
    refreshToken
  )
}

/**
 * Ensures QuickBooks token is valid and refreshes if needed
 */
export async function ensureValidToken(
  tokens: QuickBooksTokens,
  organizationId: string
): Promise<QuickBooksTokens> {
  // Check if token is expired (with 5 minute buffer)
  const bufferTime = 5 * 60 * 1000 // 5 minutes
  if (tokens.expiresAt.getTime() - Date.now() < bufferTime) {
    // Refresh token
    const refreshed = await refreshQuickBooksToken(tokens.refreshToken)
    return {
      ...refreshed,
      realmId: tokens.realmId, // Preserve realm ID
    }
  }
  return tokens
}

/**
 * Fetches Profit & Loss report (read-only)
 */
export async function fetchProfitAndLossReport(
  tokens: QuickBooksTokens,
  organizationId: string,
  startDate?: string,
  endDate?: string
): Promise<QuickBooksReport> {
  const validTokens = await ensureValidToken(tokens, organizationId)
  const client = createQuickBooksClient(
    validTokens.accessToken,
    validTokens.refreshToken,
    validTokens.realmId,
    organizationId
  )

  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      reportName: 'ProfitAndLoss',
    }

    if (startDate) {
      options.start_date = startDate
    }
    if (endDate) {
      options.end_date = endDate
    }

    client.report(options, (error: Error | null, report: unknown) => {
      if (error) {
        reject(error)
        return
      }

      // Parse report data
      const reportData = report as { Rows?: { Row?: unknown[] } }
      const rows = reportData.Rows?.Row || []

      resolve({
        reportName: 'ProfitAndLoss',
        data: rows.map((row: unknown) => row as Record<string, unknown>),
      })
    })
  })
}

/**
 * Fetches Balance Sheet report (read-only)
 */
export async function fetchBalanceSheetReport(
  tokens: QuickBooksTokens,
  organizationId: string,
  asOfDate?: string
): Promise<QuickBooksReport> {
  const validTokens = await ensureValidToken(tokens, organizationId)
  const client = createQuickBooksClient(
    validTokens.accessToken,
    validTokens.refreshToken,
    validTokens.realmId,
    organizationId
  )

  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      reportName: 'BalanceSheet',
    }

    if (asOfDate) {
      options.as_of_date = asOfDate
    }

    client.report(options, (error: Error | null, report: unknown) => {
      if (error) {
        reject(error)
        return
      }

      const reportData = report as { Rows?: { Row?: unknown[] } }
      const rows = reportData.Rows?.Row || []

      resolve({
        reportName: 'BalanceSheet',
        data: rows.map((row: unknown) => row as Record<string, unknown>),
      })
    })
  })
}

/**
 * Fetches transactions (read-only)
 */
export async function fetchTransactions(
  tokens: QuickBooksTokens,
  organizationId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 100
): Promise<QuickBooksTransaction[]> {
  const validTokens = await ensureValidToken(tokens, organizationId)
  const client = createQuickBooksClient(
    validTokens.accessToken,
    validTokens.refreshToken,
    validTokens.realmId,
    organizationId
  )

  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      maxResults: limit,
    }

    if (startDate) {
      options.start_date = startDate
    }
    if (endDate) {
      options.end_date = endDate
    }

    client.findTransactions(options, (error: Error | null, transactions: unknown) => {
      if (error) {
        reject(error)
        return
      }

      const transactionList = (transactions as { QueryResponse?: { Transaction?: unknown[] } })
        .QueryResponse?.Transaction || []

      resolve(
        transactionList.map((tx: unknown) => {
          const t = tx as Record<string, unknown>
          return {
            id: String(t.Id || ''),
            date: String(t.TxnDate || ''),
            amount: Number(t.TotalAmt || 0),
            description: String(t.DocNumber || t.Line?.[0]?.Description || ''),
            type: String(t.TxnType || ''),
            account: t.Line?.[0]?.AccountRef?.name
              ? String(t.Line[0].AccountRef.name)
              : undefined,
          } as QuickBooksTransaction
        })
      )
    })
  })
}

/**
 * Fetches accounts (read-only)
 */
export async function fetchAccounts(
  tokens: QuickBooksTokens,
  organizationId: string
): Promise<QuickBooksAccount[]> {
  const validTokens = await ensureValidToken(tokens, organizationId)
  const client = createQuickBooksClient(
    validTokens.accessToken,
    validTokens.refreshToken,
    validTokens.realmId,
    organizationId
  )

  return new Promise((resolve, reject) => {
    client.findAccounts({}, (error: Error | null, accounts: unknown) => {
      if (error) {
        reject(error)
        return
      }

      const accountList = (accounts as { QueryResponse?: { Account?: unknown[] } })
        .QueryResponse?.Account || []

      resolve(
        accountList.map((acc: unknown) => {
          const a = acc as Record<string, unknown>
          return {
            id: String(a.Id || ''),
            name: String(a.Name || ''),
            type: String(a.AccountType || ''),
            balance: a.CurrentBalance ? Number(a.CurrentBalance) : undefined,
          } as QuickBooksAccount
        })
      )
    })
  })
}

