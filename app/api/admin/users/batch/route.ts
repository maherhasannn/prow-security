import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, auditLogs, organizationMembers, organizations } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth/middleware'
import { inArray, eq, sql } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const body = await request.json()

    const { action, userIds } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'No users selected' }, { status: 400 })
    }

    // Prevent self-modification
    if (userIds.includes(session.user.id)) {
      return NextResponse.json({ error: 'Cannot modify your own account in bulk actions' }, { status: 400 })
    }

    let affectedCount = 0

    switch (action) {
      case 'delete': {
        // For each user, check if they're the sole member of any org
        for (const userId of userIds) {
          const ownedOrgs = await db
            .select({ organizationId: organizationMembers.organizationId })
            .from(organizationMembers)
            .where(eq(organizationMembers.userId, userId))

          for (const org of ownedOrgs) {
            const [memberCount] = await db
              .select({ count: sql<number>`count(*)::int` })
              .from(organizationMembers)
              .where(eq(organizationMembers.organizationId, org.organizationId))

            if (memberCount && memberCount.count <= 1) {
              await db.delete(organizations).where(eq(organizations.id, org.organizationId))
            }
          }
        }

        const result = await db
          .delete(users)
          .where(inArray(users.id, userIds))
          .returning({ id: users.id })
        affectedCount = result.length
        break
      }

      case 'suspend': {
        const result = await db
          .update(users)
          .set({ status: 'suspended', updatedAt: new Date() })
          .where(inArray(users.id, userIds))
          .returning({ id: users.id })
        affectedCount = result.length
        break
      }

      case 'activate': {
        const result = await db
          .update(users)
          .set({ status: 'active', updatedAt: new Date() })
          .where(inArray(users.id, userIds))
          .returning({ id: users.id })
        affectedCount = result.length
        break
      }

      case 'reset_tokens': {
        const result = await db
          .update(users)
          .set({ tokensUsed: 0, updatedAt: new Date() })
          .where(inArray(users.id, userIds))
          .returning({ id: users.id })
        affectedCount = result.length
        break
      }

      case 'set_role_user': {
        const result = await db
          .update(users)
          .set({ role: 'user', updatedAt: new Date() })
          .where(inArray(users.id, userIds))
          .returning({ id: users.id })
        affectedCount = result.length
        break
      }

      case 'set_role_power_user': {
        const result = await db
          .update(users)
          .set({ role: 'power_user', updatedAt: new Date() })
          .where(inArray(users.id, userIds))
          .returning({ id: users.id })
        affectedCount = result.length
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Log the batch action
    if (session.user.organizationId) {
      await db.insert(auditLogs).values({
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: `admin_batch_${action}`,
        resourceType: 'user',
        metadata: { userIds, affectedCount },
      })
    }

    return NextResponse.json({
      success: true,
      message: `${affectedCount} users affected`,
      affectedCount,
    })
  } catch (error) {
    console.error('Admin batch action error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to perform batch action' }, { status: 500 })
  }
}
