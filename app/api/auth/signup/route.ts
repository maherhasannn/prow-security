import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations, organizationMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const timestamp = new Date().toISOString()
  console.log(`[SIGNUP ${timestamp}] Starting signup request`)

  try {
    const body = await request.json()
    const { name, email, password, orgName, roleTitle, companySize } = body
    console.log(`[SIGNUP ${timestamp}] Received signup for email: ${email ? email.substring(0, 3) + '***' : 'undefined'}`)

    // Validation
    if (!name || !email || !password) {
      console.log(`[SIGNUP ${timestamp}] Validation failed: missing required fields`)
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      console.log(`[SIGNUP ${timestamp}] Validation failed: password too short`)
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log(`[SIGNUP ${timestamp}] Validation failed: invalid email format`)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.log(`[SIGNUP ${timestamp}] Step 1: Checking if user exists...`)

    // Check if user already exists
    let existingUser
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1)
      existingUser = result[0]
      console.log(`[SIGNUP ${timestamp}] Step 1 complete: User exists check passed`)
    } catch (dbError) {
      console.error(`[SIGNUP ${timestamp}] Step 1 FAILED: Database query error`, {
        error: dbError instanceof Error ? dbError.message : dbError,
        code: (dbError as { code?: string })?.code,
      })
      throw dbError
    }

    if (existingUser) {
      console.log(`[SIGNUP ${timestamp}] User already exists`)
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    console.log(`[SIGNUP ${timestamp}] Step 2: Hashing password...`)
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)
    console.log(`[SIGNUP ${timestamp}] Step 2 complete: Password hashed`)

    console.log(`[SIGNUP ${timestamp}] Step 3: Creating user record...`)
    // Create user
    let user
    try {
      const result = await db
        .insert(users)
        .values({
          email: email.toLowerCase().trim(),
          name: name.trim(),
          passwordHash,
        })
        .returning()
      user = result[0]
      console.log(`[SIGNUP ${timestamp}] Step 3 complete: User created with ID ${user.id}`)
    } catch (dbError) {
      console.error(`[SIGNUP ${timestamp}] Step 3 FAILED: User insert error`, {
        error: dbError instanceof Error ? dbError.message : dbError,
        code: (dbError as { code?: string })?.code,
      })
      throw dbError
    }

    // Generate organization slug from email domain or use a default
    // Make it unique by including user ID
    const emailDomain = email.split('@')[1]?.split('.')[0] || 'personal'
    // Clean domain name (remove special chars, limit length)
    const cleanDomain = emailDomain.replace(/[^a-z0-9]/gi, '').slice(0, 20).toLowerCase()
    const orgSlug = `${cleanDomain}-${user.id.slice(0, 8)}`.toLowerCase()

    console.log(`[SIGNUP ${timestamp}] Step 4: Creating organization...`)
    // Create organization for the user
    let organization
    try {
      const result = await db
        .insert(organizations)
        .values({
          name: orgName?.trim() || `${name.trim()}'s Organization`,
          slug: orgSlug,
          ...(companySize && { companySize }),
        })
        .returning()
      organization = result[0]
      console.log(`[SIGNUP ${timestamp}] Step 4 complete: Organization created with ID ${organization.id}`)
    } catch (dbError) {
      console.error(`[SIGNUP ${timestamp}] Step 4 FAILED: Organization insert error`, {
        error: dbError instanceof Error ? dbError.message : dbError,
        code: (dbError as { code?: string })?.code,
      })
      throw dbError
    }

    console.log(`[SIGNUP ${timestamp}] Step 5: Adding user as organization owner...`)
    // Add user as owner of the organization
    try {
      await db.insert(organizationMembers).values({
        organizationId: organization.id,
        userId: user.id,
        role: 'owner',
        ...(roleTitle?.trim() && { roleTitle: roleTitle.trim() }),
      })
      console.log(`[SIGNUP ${timestamp}] Step 5 complete: Organization member created`)
    } catch (dbError) {
      console.error(`[SIGNUP ${timestamp}] Step 5 FAILED: Organization member insert error`, {
        error: dbError instanceof Error ? dbError.message : dbError,
        code: (dbError as { code?: string })?.code,
      })
      throw dbError
    }

    console.log(`[SIGNUP ${timestamp}] SUCCESS: Account created for ${email.substring(0, 3)}***`)
    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    // Log detailed error information for debugging
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorCode = (error as { code?: string })?.code

    console.error(`[SIGNUP ${timestamp}] CAUGHT ERROR:`, {
      message: errorMessage,
      code: errorCode,
      name: error instanceof Error ? error.name : undefined,
      stack: errorStack,
    })

    // Handle Supabase/Postgres tenant errors (paused or deleted database)
    if (
      errorMessage.includes('Tenant') ||
      errorMessage.includes('tenant') ||
      errorMessage.includes('not found') ||
      errorCode === 'XX000'
    ) {
      console.error(`[SIGNUP ${timestamp}] DATABASE TENANT ERROR: Database may be paused or deleted`)
      return NextResponse.json(
        {
          error: 'Database unavailable. The database may be paused or misconfigured.',
          code: 'DB_TENANT_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            details: errorMessage,
          }),
        },
        { status: 503 }
      )
    }

    // Handle database constraint errors
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      console.error(`[SIGNUP ${timestamp}] DUPLICATE EMAIL ERROR`)
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Handle missing table errors (migration issue)
    if (
      errorMessage.includes('relation') &&
      errorMessage.includes('does not exist')
    ) {
      console.error(`[SIGNUP ${timestamp}] MISSING TABLES ERROR: Run migrations`)
      return NextResponse.json(
        {
          error: 'Database tables missing. Please run migrations.',
          code: 'DB_MIGRATION_NEEDED',
          ...(process.env.NODE_ENV === 'development' && {
            details: 'Required database tables are missing. Run: npm run db:migrate:prod',
          }),
        },
        { status: 500 }
      )
    }

    // Handle connection errors
    if (
      errorMessage.includes('connection') ||
      errorMessage.includes('connect') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ETIMEDOUT')
    ) {
      console.error(`[SIGNUP ${timestamp}] CONNECTION ERROR: ${errorMessage}`)
      return NextResponse.json(
        {
          error: 'Database connection error. Please try again later.',
          code: 'DB_CONNECTION_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            details: errorMessage,
          }),
        },
        { status: 503 }
      )
    }

    // Handle SSL/TLS errors
    if (
      errorMessage.includes('SSL') ||
      errorMessage.includes('TLS') ||
      errorMessage.includes('certificate')
    ) {
      console.error(`[SIGNUP ${timestamp}] SSL ERROR: ${errorMessage}`)
      return NextResponse.json(
        {
          error: 'Database SSL connection error.',
          code: 'DB_SSL_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            details: errorMessage,
          }),
        },
        { status: 503 }
      )
    }

    // Generic error response
    console.error(`[SIGNUP ${timestamp}] UNHANDLED ERROR TYPE: ${errorMessage}`)
    return NextResponse.json(
      {
        error: 'Failed to create account. Please try again.',
        code: 'UNKNOWN_ERROR',
        // In development, provide error details for debugging
        ...(process.env.NODE_ENV === 'development' && {
          details: errorMessage,
        }),
      },
      { status: 500 }
    )
  }
}

