// Load environment variables FIRST, before any other imports
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import postgres from 'postgres'

// Load .env.local for local execution, but production should have env vars set
dotenv.config({ path: '.env.local' })

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

/**
 * Run database migrations
 * 
 * This function can be called from:
 * 1. The CLI script (when run directly via tsx)
 * 2. The API endpoint (when called via HTTP)
 * 
 * Returns a result object instead of calling process.exit()
 */
export async function runMigrations(): Promise<{
  success: boolean
  message: string
  migrationsRun: number
  errors?: string[]
}> {
  try {
    // Get connection string
    const connectionString = getPostgresUrl()
    
    console.log('🚀 Starting database migrations...\n')
    console.log('✅ Database connection string configured')

    // Connect to database
    const sql = postgres(connectionString, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    })

    // Test connection
    await sql`SELECT 1`
    console.log('✅ Database connection successful\n')

    // Get migration files directory
    const migrationsDir = path.join(process.cwd(), 'lib', 'db', 'migrations')
    
    // Get all SQL migration files (excluding meta directory)
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()

    if (files.length === 0) {
      console.log('⚠️  No migration files found in lib/db/migrations')
      await sql.end()
      return {
        success: true,
        message: 'No migration files found',
        migrationsRun: 0,
      }
    }

    console.log(`📦 Found ${files.length} migration file(s):\n`)

    const errors: string[] = []
    let migrationsRun = 0

    // Execute each migration file
    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      const sqlContent = fs.readFileSync(filePath, 'utf-8')

      console.log(`📄 Executing migration: ${file}`)

      try {
        // Split by statement breakpoints and execute each statement
        const statements = sqlContent
          .split('--> statement-breakpoint')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'))

        for (const statement of statements) {
          if (statement.trim()) {
            await sql.unsafe(statement)
          }
        }

        console.log(`✅ Migration ${file} completed successfully\n`)
        migrationsRun++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // If migration already applied, that's okay (idempotent)
        if (
          errorMessage.includes('already exists') ||
          errorMessage.includes('duplicate') ||
          (errorMessage.includes('does not exist') && errorMessage.includes('DROP'))
        ) {
          console.log(`⚠️  Migration ${file} already applied or partially applied (safe to ignore)\n`)
          migrationsRun++
        } else {
          const fullError = `Migration ${file}: ${errorMessage}`
          console.error(`❌ Error executing migration ${file}:`, errorMessage)
          errors.push(fullError)
        }
      }
    }

    await sql.end()
    
    if (errors.length > 0) {
      console.log('⚠️  Migrations completed with errors')
      return {
        success: false,
        message: 'Migrations completed with errors',
        migrationsRun,
        errors,
      }
    }

    console.log('✅ All migrations completed successfully!')
    console.log('\n🎉 Database is ready for use.\n')

    return {
      success: true,
      message: 'All migrations completed successfully',
      migrationsRun,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('\n❌ Migration error:', error)
    if (error instanceof Error) {
      console.error('Error message:', errorMessage)
      console.error('Error stack:', errorStack)
    }
    
    throw new Error(`Migration failed: ${errorMessage}`)
  }
}

// Only run migrations directly if this script is executed directly (not imported)
// This allows the function to be imported and used in API routes
// Check if we're being run as a script (not imported as a module)
if (import.meta.url === `file://${process.argv[1]}` || require.main === module) {
  // Check if we're in a deployment/build environment where migrations should run
  // In Vercel, environment variables are available during build
  // Skip migrations if we can't get connection info (e.g., local dev without env vars)
  let connectionString: string
  try {
    connectionString = getPostgresUrl()
  } catch (error) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      // In production/Vercel, we should have env vars - rethrow the error
      throw error
    }
    // In local dev, it's okay to skip if env vars aren't set
    console.log('⚠️  Skipping migrations: Database connection not configured')
    console.log('   (This is normal for local development without .env.local)\n')
    process.exit(0)
  }

  runMigrations()
    .then((result) => {
      if (result.success) {
        process.exit(0)
      } else {
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

