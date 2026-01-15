// Load environment variables FIRST, before any other imports
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Now import everything else after env vars are loaded
import { db } from '../lib/db'
import { users, organizations, organizationMembers } from '../lib/db/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function createTestUser() {
  try {
    // Check if POSTGRES_URL is set
    if (!process.env.POSTGRES_URL) {
      console.error('Error: POSTGRES_URL environment variable is not set')
      console.error('Please set it in your .env.local file or environment')
      process.exit(1)
    }

    const testEmail = 'test@prow.com'
    const testPassword = 'test123456'
    const testName = 'Test User'
    const orgName = 'Test Organization'
    const orgSlug = 'test-org'

    console.log('Creating test user...')
    console.log(`Email: ${testEmail}`)
    console.log(`Password: ${testPassword}`)

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
      console.log('User already exists. Updating password...')
      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, existingUser.id))
      console.log('Password updated successfully!')
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

      console.log('User created successfully!')
      console.log(`User ID: ${user.id}`)
      userId = user.id
    }

    // Check if organization exists
    const [existingOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1)

    let orgId: string

    if (existingOrg) {
      console.log('Organization already exists.')
      orgId = existingOrg.id
    } else {
      // Create organization
      const [org] = await db
        .insert(organizations)
        .values({
          name: orgName,
          slug: orgSlug,
        })
        .returning()

      console.log('Organization created successfully!')
      console.log(`Organization ID: ${org.id}`)
      orgId = org.id
    }

    // Check if membership exists
    const [existingMembership] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, userId)
        )
      )
      .limit(1)

    if (!existingMembership) {
      // Add user to organization as owner
      await db.insert(organizationMembers).values({
        organizationId: orgId,
        userId: userId,
        role: 'owner',
      })

      console.log('User added to organization as owner!')
    } else {
      console.log('User is already a member of the organization.')
    }

    console.log('\n✅ Test user created successfully!')
    console.log('\nYou can now login with:')
    console.log(`Email: ${testEmail}`)
    console.log(`Password: ${testPassword}`)
    console.log('\nVisit: http://localhost:3000/auth/signin')

    process.exit(0)
  } catch (error) {
    console.error('Error creating test user:', error)
    process.exit(1)
  }
}

createTestUser()

