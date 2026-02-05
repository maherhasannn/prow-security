import { auth } from './config'
import { db } from '@/lib/db'
import { organizationMembers, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { AuthenticationError, AuthorizationError, NotFoundError } from '@/lib/utils/errors'

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

/**
 * Ensures the user is authenticated
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new AuthenticationError('Authentication required')
  }
  return session
}

/**
 * Gets the current user's session
 */
export async function getSession() {
  return await auth()
}

/**
 * Gets the current user's organization ID
 */
export async function getUserOrganizationId(): Promise<string> {
  const session = await requireAuth()
  if (!session.user.organizationId) {
    throw new AuthenticationError('No organization context found')
  }
  return session.user.organizationId
}

/**
 * Gets the current user's ID
 */
export async function getUserId(): Promise<string> {
  const session = await requireAuth()
  return session.user.id
}

/**
 * Verifies the user has access to the specified organization
 */
export async function requireOrganizationAccess(organizationId: string): Promise<UserRole> {
  const session = await requireAuth()
  
  // Check if user's session organization matches
  if (session.user.organizationId === organizationId) {
    return session.user.role || 'member'
  }

  // Check database for membership
  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, session.user.id)
      )
    )
    .limit(1)

  if (!membership) {
    throw new AuthorizationError('Access denied to this organization')
  }

  return membership.role as UserRole
}

/**
 * Checks if user has required role or higher
 */
export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    member: 2,
    admin: 3,
    owner: 4,
  }

  if (!userRole) return false
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Requires a specific role or higher
 */
export async function requireRole(
  organizationId: string,
  requiredRole: UserRole
): Promise<UserRole> {
  const userRole = await requireOrganizationAccess(organizationId)
  
  if (!hasRole(userRole, requiredRole)) {
    throw new AuthorizationError(
      `This action requires ${requiredRole} role or higher`
    )
  }

  return userRole
}

/**
 * Gets user's role in an organization
 */
export async function getUserRole(organizationId: string): Promise<UserRole | null> {
  try {
    const session = await requireAuth()

    if (session.user.organizationId === organizationId) {
      return session.user.role || null
    }

    const [membership] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, session.user.id)
        )
      )
      .limit(1)

    return membership?.role as UserRole | null
  } catch {
    return null
  }
}

/**
 * Requires the user to be a system admin
 */
export async function requireAdmin() {
  const session = await requireAuth()

  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user?.isAdmin) {
    throw new AuthorizationError('Admin access required')
  }

  return session
}



