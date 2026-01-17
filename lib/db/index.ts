import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
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

/**
 * Get the PostgreSQL connection string from environment variables.
 * Supports both direct POSTGRES_URL and individual connection parameters
 * (for Supabase and other providers that provide separate credentials).
 */
function getPostgresUrl(): string {
  // If POSTGRES_URL is directly provided, use it
  if (process.env.POSTGRES_URL) {
    return process.env.POSTGRES_URL
  }

  // Otherwise, construct from individual parameters (Supabase style)
  const host = process.env.POSTGRES_HOST
  const user = process.env.POSTGRES_USER
  const password = process.env.POSTGRES_PASSWORD
  const database = process.env.POSTGRES_DATABASE
  const port = process.env.POSTGRES_PORT || '5432'

  if (!host || !user || !password || !database) {
    throw new Error(
      'Database connection configuration is missing. ' +
      'Please provide either POSTGRES_URL or all of the following: ' +
      'POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DATABASE. ' +
      'Set these in your deployment platform\'s environment variables.'
    )
  }

  // Construct connection string
  // Format: postgresql://user:password@host:port/database?sslmode=require
  const sslMode = process.env.POSTGRES_SSLMODE || 'require'
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=${sslMode}`
}

// Lazy initialization - only create db connection when actually used
// This prevents build-time errors when POSTGRES_URL is not set
let dbInstance: ReturnType<typeof drizzle> | null = null
let sqlInstance: ReturnType<typeof postgres> | null = null

function getDb() {
  if (!dbInstance) {
    const connectionString = getPostgresUrl()

    // Create postgres client with connection pooling for serverless environments
    // max: 1 connection per serverless function invocation
    // idle_timeout: 20 seconds
    sqlInstance = postgres(connectionString, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    })

    dbInstance = drizzle(sqlInstance, { schema })
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

// Export sql instance for raw queries if needed
export function getSql() {
  if (!sqlInstance) {
    const connectionString = getPostgresUrl()
    sqlInstance = postgres(connectionString, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  }
  return sqlInstance
}

export * from './schema'

