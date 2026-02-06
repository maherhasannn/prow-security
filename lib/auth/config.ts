import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { users, organizationMembers } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      email: string
      name: string
      organizationId?: string
      role?: 'owner' | 'admin' | 'member' | 'viewer'
    }
  }

  interface User {
    id: string
    email: string
    name: string
    organizationId?: string
    role?: 'owner' | 'admin' | 'member' | 'viewer'
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const timestamp = new Date().toISOString()
        console.log(`[SIGNIN ${timestamp}] Starting authorization`)

        if (!credentials?.email || !credentials?.password) {
          console.log(`[SIGNIN ${timestamp}] Missing credentials`)
          return null
        }

        const normalizedEmail = (credentials.email as string).toLowerCase().trim()
        console.log(`[SIGNIN ${timestamp}] Looking up user: ${normalizedEmail.substring(0, 3)}***`)

        try {
          // Find user by email (normalize to lowercase to match how emails are stored)
          console.log(`[SIGNIN ${timestamp}] Step 1: Querying user from database...`)
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1)
          console.log(`[SIGNIN ${timestamp}] Step 1 complete: User ${user ? 'found' : 'not found'}`)

          if (!user || !user.passwordHash) {
            console.log(`[SIGNIN ${timestamp}] User not found or no password hash`)
            return null
          }

          // Verify password
          console.log(`[SIGNIN ${timestamp}] Step 2: Verifying password...`)
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          )
          console.log(`[SIGNIN ${timestamp}] Step 2 complete: Password ${isValid ? 'valid' : 'invalid'}`)

          if (!isValid) {
            console.log(`[SIGNIN ${timestamp}] Invalid password`)
            return null
          }

          // Update login tracking
          console.log(`[SIGNIN ${timestamp}] Step 3: Updating login tracking...`)
          await db
            .update(users)
            .set({
              loginCount: sql`${users.loginCount} + 1`,
              lastLoginAt: new Date(),
            })
            .where(eq(users.id, user.id))
          console.log(`[SIGNIN ${timestamp}] Step 3 complete: Login tracked`)

          // Get user's primary organization and role
          console.log(`[SIGNIN ${timestamp}] Step 4: Getting organization membership...`)
          const [membership] = await db
            .select()
            .from(organizationMembers)
            .where(eq(organizationMembers.userId, user.id))
            .orderBy(organizationMembers.createdAt)
            .limit(1)
          console.log(`[SIGNIN ${timestamp}] Step 4 complete: Membership ${membership ? 'found' : 'not found'}`)

          console.log(`[SIGNIN ${timestamp}] SUCCESS: User authenticated`)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            organizationId: membership?.organizationId,
            role: membership?.role,
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          const errorCode = (error as { code?: string })?.code
          console.error(`[SIGNIN ${timestamp}] DATABASE ERROR:`, {
            message: errorMessage,
            code: errorCode,
            name: error instanceof Error ? error.name : undefined,
          })
          // Re-throw to let NextAuth handle it
          throw error
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.organizationId = user.organizationId
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.organizationId = token.organizationId as string | undefined
        session.user.role = token.role as 'owner' | 'admin' | 'member' | 'viewer' | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET
    // Only enforce secret check at runtime, not during build
    // During build (including "Collecting page data" phase), Next.js may execute route handlers
    // but env vars may not be available in CI/CD even though they're set in Vercel for runtime.
    // NEXT_PHASE might not be set during "Collecting page data", so we err on the side of caution
    // and only throw if we're clearly NOT in a build phase (NEXT_PHASE is set but not a build phase).
    const nextPhase = process.env.NEXT_PHASE
    const isBuildPhase = 
      nextPhase === 'phase-production-build' ||
      nextPhase === 'phase-development-build'
    
    // Only throw if:
    // 1. We're in production
    // 2. Secret is missing
    // 3. NEXT_PHASE is explicitly set AND it's NOT a build phase
    // If NEXT_PHASE is undefined, we assume we're in build and don't throw (safe default)
    if (!secret && process.env.NODE_ENV === 'production' && nextPhase && !isBuildPhase) {
      throw new Error(
        'NEXTAUTH_SECRET environment variable is required in production. ' +
        'Please set it in your Vercel project settings under Settings > Environment Variables.'
      )
    }
    return secret || 'dev-secret-change-in-production'
  })(),
  debug: process.env.NODE_ENV === 'development',
})


