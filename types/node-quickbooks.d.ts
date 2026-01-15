declare module 'node-quickbooks' {
  class QuickBooks {
    constructor(
      consumerKey: string,
      consumerSecret: string,
      token: string,
      isSandbox: boolean,
      realmId: string,
      enableLogging: boolean,
      enableDebug: boolean,
      minorVersion: string | null,
      oauthVersion: string,
      refreshToken: string
    )

    report(options: Record<string, unknown>, callback: (error: Error | null, report: unknown) => void): void
    findTransactions(options: Record<string, unknown>, callback: (error: Error | null, transactions: unknown) => void): void
    findAccounts(options: Record<string, unknown>, callback: (error: Error | null, accounts: unknown) => void): void
    [key: string]: unknown
  }

  export = QuickBooks
}

