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
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          migrations: 'unknown',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}


