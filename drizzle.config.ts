import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

/**
 * Get the PostgreSQL connection string from environment variables.
 * Supports both direct POSTGRES_URL and individual connection parameters.
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
      'POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DATABASE.'
    )
  }

  // Construct connection string
  // Format: postgresql://user:password@host:port/database?sslmode=require
  const sslMode = process.env.POSTGRES_SSLMODE || 'require'
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=${sslMode}`
}

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getPostgresUrl(),
  },
  verbose: true,
  strict: true,
} satisfies Config

