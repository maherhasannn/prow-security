import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations, organizationMembers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    // Only allow in development or with a secret key for production
    const isDevelopment = process.env.NODE_ENV === 'development'
    const authHeader = request.headers.get('authorization')
    const secretKey = process.env.TEST_USER_SECRET_KEY || 'dev-secret-key'

    // Check authorization (only in production)
    if (!isDevelopment) {
      if (!authHeader || authHeader !== `Bearer ${secretKey}`) {
        return NextResponse.json(
          { error: 'Unauthorized. Provide Authorization: Bearer <TEST_USER_SECRET_KEY>' },
          { status: 401 }
        )
      }
    }

    const testEmail = 'test@prow.com'
    const testPassword = 'test123456'
    const testName = 'Test User'
    const orgName = 'Test Organization'

    // Hash password
    const passwordHash = await bcrypt.hash(testPassword, 10)

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1)

    let userId: string

    if (existingUser) {
      // Update existing user password
      await db
        .update(users)
        .set({ passwordHash, name: testName })
        .where(eq(users.id, existingUser.id))
      userId = existingUser.id
    } else {
      // Create user
      const [user] = await db
        .insert(users)
        .values({
          email: testEmail,
          name: testName,
          passwordHash,
        })
        .returning()

      userId = user.id
    }

    // Get or create organization
    // Find user's existing organization or create one
    const [existingMembership] = await db
      .select({
        organizationId: organizationMembers.organizationId,
        organizationName: organizations.name,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
      .where(eq(organizationMembers.userId, userId))
      .limit(1)

    let orgId: string

    if (existingMembership) {
      orgId = existingMembership.organizationId
    } else {
      // Create organization
      const emailDomain = testEmail.split('@')[1]?.split('.')[0] || 'test'
      const orgSlug = `${emailDomain}-${userId.slice(0, 8)}`.toLowerCase()

      const [org] = await db
        .insert(organizations)
        .values({
          name: orgName,
          slug: orgSlug,
        })
        .returning()

      orgId = org.id

      // Add user to organization as owner
      await db.insert(organizationMembers).values({
        organizationId: orgId,
        userId: userId,
        role: 'owner',
      })
    }

    return NextResponse.json(
      {
        message: 'Test user created/updated successfully',
        credentials: {
          email: testEmail,
          password: testPassword,
        },
        user: {
          id: userId,
          email: testEmail,
          name: testName,
        },
        organizationId: orgId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating test user:', error)
    
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      { error: `Failed to create test user: ${errorMessage}` },
      { status: 500 }
    )
  }
}

