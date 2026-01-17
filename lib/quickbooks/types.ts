export interface QuickBooksConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  environment: 'sandbox' | 'production'
}

export interface QuickBooksTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  realmId: string
}

export interface QuickBooksReport {
  reportName: string
  data: Record<string, unknown>[]
  metadata?: Record<string, unknown>
}

export interface QuickBooksTransaction {
  id: string
  date: string
  amount: number
  description: string
  type: string
  account?: string
}

export interface QuickBooksAccount {
  id: string
  name: string
  type: string
  balance?: number
}


