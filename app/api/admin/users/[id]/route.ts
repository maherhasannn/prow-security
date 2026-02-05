import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizationMembers, organizations, auditLogs } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth/middleware'
import { eq, sql } from 'drizzle-orm'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const [existingUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get organizations where user is the owner
    const ownedOrgs = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, id))

    // Delete user - cascading deletes will handle:
    // - organization_members (cascade)
    // - ai_sessions (cascade)
    // - documents.createdBy (but document stays - just loses creator ref)
    // - workspaces.createdBy (but workspace stays)
    // - audit_logs.userId (but log stays)

    // For organizations where user is the sole owner, we need to handle those
    // For now, we'll delete the organizations where user is the only member
    for (const org of ownedOrgs) {
      const [memberCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, org.organizationId))

      // If user is the only member, delete the organization (cascades to workspaces, documents, etc.)
      if (memberCount && memberCount.count <= 1) {
        await db.delete(organizations).where(eq(organizations.id, org.organizationId))
      }
    }

    // Delete the user
    await db.delete(users).where(eq(users.id, id))

    // Log the deletion if admin has an organization
    if (session.user.organizationId) {
      await db.insert(auditLogs).values({
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'admin_user_delete',
        resourceType: 'user',
        resourceId: id,
        metadata: { deletedUserEmail: existingUser.email },
      })
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Admin delete user error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
