import { drizzle } from 'drizzle-orm/vercel-postgres'
import { sql } from '@vercel/postgres'
import * as schema from './schema'

// Try to load .env.local if POSTGRES_URL is not set (for scripts)
// Don't throw during build - Vercel sets env vars at runtime
if (!process.env.POSTGRES_URL) {
  try {
    // Use dynamic require for dotenv (only used in development/scripts)
    // TypeScript allows require in try-catch blocks
    // eslint-disable-next-line
    const dotenv = require('dotenv')
    dotenv.config({ path: '.env.local' })
  } catch {
    // dotenv might not be available, that's okay
  }
}

// Lazy initialization - only create db connection when actually used
// This prevents build-time errors when POSTGRES_URL is not set
let dbInstance: ReturnType<typeof drizzle> | null = null

function getDb() {
  if (!dbInstance) {
    if (!process.env.POSTGRES_URL) {
      throw new Error(
        'POSTGRES_URL environment variable is not set. ' +
        'Please configure it in your Vercel project settings under Settings > Environment Variables.'
      )
    }
    dbInstance = drizzle(sql, { schema })
  }
  return dbInstance
}

// Export a proxy that lazily initializes the db
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const db = getDb()
    const value = db[prop as keyof ReturnType<typeof drizzle>]
    return typeof value === 'function' ? value.bind(db) : value
  }
}) as ReturnType<typeof drizzle>

export * from './schema'

