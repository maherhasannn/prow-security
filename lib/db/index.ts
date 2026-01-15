import { drizzle } from 'drizzle-orm/vercel-postgres'
import { sql } from '@vercel/postgres'
import * as schema from './schema'

// Try to load .env.local if POSTGRES_URL is not set (for scripts)
if (!process.env.POSTGRES_URL) {
  try {
    require('dotenv').config({ path: '.env.local' })
  } catch {
    // dotenv might not be available, that's okay
  }
  
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set')
  }
}

export const db = drizzle(sql, { schema })

export * from './schema'

