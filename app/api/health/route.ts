import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from '@vercel/postgres'

/**
 * GET /api/health - Health check endpoint
 */
export async function GET() {
  try {
    // Check database connection
    await sql`SELECT 1`

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}


