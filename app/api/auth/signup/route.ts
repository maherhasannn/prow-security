import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizations, organizationMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
      })
      .returning()

    // Generate organization slug from email domain or use a default
    // Make it unique by including user ID
    const emailDomain = email.split('@')[1]?.split('.')[0] || 'personal'
    // Clean domain name (remove special chars, limit length)
    const cleanDomain = emailDomain.replace(/[^a-z0-9]/gi, '').slice(0, 20).toLowerCase()
    const orgSlug = `${cleanDomain}-${user.id.slice(0, 8)}`.toLowerCase()

    // Create organization for the user
    const [organization] = await db
      .insert(organizations)
      .values({
        name: `${name.trim()}'s Organization`,
        slug: orgSlug,
      })
      .returning()

    // Add user as owner of the organization
    await db.insert(organizationMembers).values({
      organizationId: organization.id,
      userId: user.id,
      role: 'owner',
    })

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
    console.error('Sign up error:', error)
    
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    // Handle database constraint errors
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}

