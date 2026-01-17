import { NextResponse } from 'next/server'
import { runMigrations } from '@/scripts/migrate-production'

/**
 * POST /api/migrations/run - Run database migrations
 * 
 * This endpoint is secured with a secret token and should be called
 * via Vercel deployment webhook after successful builds.
 * 
 * Security: Requires MIGRATION_SECRET environment variable to match
 */
export async function POST(request: Request) {
  try {
    // Get the secret from the request (can be in header or body)
    const authHeader = request.headers.get('authorization')
    const body = await request.json().catch(() => ({}))
    
    const providedSecret = 
      authHeader?.replace('Bearer ', '') || 
      body.secret || 
      request.headers.get('x-migration-secret')

    const expectedSecret = process.env.MIGRATION_SECRET

    // Security check: Only allow if secret is set and matches
    if (!expectedSecret) {
      console.error('MIGRATION_SECRET not configured in environment')
      return NextResponse.json(
        { 
          error: 'Migration endpoint not configured. Please set MIGRATION_SECRET in Vercel environment variables.',
          instructions: '1. Go to Vercel Dashboard → Settings → Environment Variables\n2. Add MIGRATION_SECRET with a random value\n3. Redeploy or call this endpoint with the secret',
        },
        { status: 503 }
      )
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      console.warn('Unauthorized migration attempt', {
        hasSecret: !!providedSecret,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { 
          error: 'Unauthorized. MIGRATION_SECRET is required.',
          hint: 'Include the secret in Authorization header (Bearer TOKEN), X-Migration-Secret header, or request body as {secret: "..."}',
        },
        { status: 401 }
      )
    }

    // Run migrations
    console.log('Migration endpoint called - starting migrations...')
    
    const result = await runMigrations()

    return NextResponse.json({
      success: result.success,
      message: result.message,
      migrationsRun: result.migrationsRun,
      ...(result.errors && result.errors.length > 0 && { errors: result.errors }),
    }, { status: result.success ? 200 : 500 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('Migration endpoint error:', {
      message: errorMessage,
      stack: errorStack,
    })

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        // Include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/migrations/run - Check migration status
 * 
 * Simple health check to verify the endpoint is accessible
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Migration endpoint is available. Use POST with MIGRATION_SECRET to run migrations.',
    // Only show this in development
    ...(process.env.NODE_ENV === 'development' && {
      configured: !!process.env.MIGRATION_SECRET,
    }),
  })
}

