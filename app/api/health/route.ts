import { NextResponse } from 'next/server'
import { db, getSql } from '@/lib/db'
import { users, organizations, organizationMembers } from '@/lib/db/schema'

/**
 * GET /api/health - Health check endpoint
 * Verifies database connection and that required tables exist
 */
export async function GET() {
  try {
    const sql = getSql()
    
    // Check database connection
    await sql`SELECT 1`

    // Verify that critical tables exist by checking if we can query them
    // This helps identify if migrations haven't been run
    const tableChecks: Record<string, boolean> = {}
    let allTablesExist = true

    // Check if users table exists and is accessible
    try {
      await db.select().from(users).limit(1)
      tableChecks.users = true
    } catch (error) {
      tableChecks.users = false
      allTablesExist = false
      // Expose error for debugging (remove in production if sensitive)
      const err = error instanceof Error ? error.message : String(error)
      ;(tableChecks as Record<string, unknown>).users_error = err
    }

    // Check if organizations table exists and is accessible
    try {
      await db.select().from(organizations).limit(1)
      tableChecks.organizations = true
    } catch (error) {
      tableChecks.organizations = false
      allTablesExist = false
    }

    // Check if organization_members table exists and is accessible
    try {
      await db.select().from(organizationMembers).limit(1)
      tableChecks.organization_members = true
    } catch (error) {
      tableChecks.organization_members = false
      allTablesExist = false
    }

    if (!allTablesExist) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'connected',
            migrations: 'incomplete',
          },
          tables: tableChecks,
          error: 'Required database tables are missing. Please run migrations.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        migrations: 'complete',
      },
      tables: tableChecks,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = (error as { code?: string })?.code

    // Detect specific error types for better debugging
    let errorType = 'connection_failed'
    let suggestion = 'Check database connection string'

    if (errorMessage.includes('Tenant') || errorMessage.includes('tenant') || errorCode === 'XX000') {
      errorType = 'tenant_not_found'
      suggestion = 'Database may be paused (Supabase free tier) or deleted. Check your Supabase dashboard.'
    } else if (errorMessage.includes('password') || errorMessage.includes('authentication')) {
      errorType = 'auth_failed'
      suggestion = 'Database credentials are incorrect. Check POSTGRES_URL in .env.local'
    } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connect')) {
      errorType = 'connection_refused'
      suggestion = 'Cannot reach database server. Check if the host is correct.'
    } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      errorType = 'timeout'
      suggestion = 'Database connection timed out. Server may be overloaded or unreachable.'
    } else if (errorMessage.includes('SSL') || errorMessage.includes('certificate')) {
      errorType = 'ssl_error'
      suggestion = 'SSL/TLS connection issue. Check sslmode in connection string.'
    }

    console.error('[HEALTH CHECK] Database connection failed:', {
      errorType,
      message: errorMessage,
      code: errorCode,
      suggestion,
    })

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          migrations: 'unknown',
        },
        error: errorMessage,
        errorType,
        errorCode,
        suggestion,
      },
      { status: 503 }
    )
  }
}


