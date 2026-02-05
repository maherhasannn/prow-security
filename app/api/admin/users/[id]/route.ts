import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, organizationMembers, organizations, auditLogs, subscriptions, subscriptionPlans, userFlags, loginHistory } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth/middleware'
import { eq, sql, desc } from 'drizzle-orm'

// GET user detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    // Get user with basic info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's organizations
    const memberships = await db
      .select({
        organizationId: organizationMembers.organizationId,
        organizationName: organizations.name,
        role: organizationMembers.role,
        roleTitle: organizationMembers.roleTitle,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, id))

    // Get subscription info (from first org)
    let subscription = null
    if (memberships.length > 0) {
      const [sub] = await db
        .select({
          id: subscriptions.id,
          status: subscriptions.status,
          billingInterval: subscriptions.billingInterval,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          planName: subscriptionPlans.name,
          planType: subscriptionPlans.type,
        })
        .from(subscriptions)
        .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(eq(subscriptions.organizationId, memberships[0].organizationId))
        .limit(1)
      subscription = sub
    }

    // Get recent activity logs
    const activityLogs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(20)

    // Get user flags
    const flags = await db
      .select()
      .from(userFlags)
      .where(eq(userFlags.userId, id))
      .orderBy(desc(userFlags.createdAt))
      .limit(10)

    // Get recent login history
    const logins = await db
      .select()
      .from(loginHistory)
      .where(eq(loginHistory.userId, id))
      .orderBy(desc(loginHistory.createdAt))
      .limit(10)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        status: user.status,
        role: user.role,
        loginCount: user.loginCount,
        lastLoginAt: user.lastLoginAt,
        lastLoginIp: user.lastLoginIp,
        tokensUsed: user.tokensUsed,
        maxTokensLimit: user.maxTokensLimit,
        createdAt: user.createdAt,
      },
      memberships,
      subscription,
      activityLogs,
      flags,
      loginHistory: logins,
    })
  } catch (error) {
    console.error('Admin get user error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PATCH update user
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const { status, role, maxTokensLimit, isAdmin } = body

    // Build update object
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (status !== undefined) updateData.status = status
    if (role !== undefined) updateData.role = role
    if (maxTokensLimit !== undefined) updateData.maxTokensLimit = maxTokensLimit
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning()

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log the action
    if (session.user.organizationId) {
      await db.insert(auditLogs).values({
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'admin_user_update',
        resourceType: 'user',
        resourceId: id,
        metadata: { changes: body },
      })
    }

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Admin update user error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params

    if (session.user.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const [existingUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get and delete organizations where user is sole member
    const ownedOrgs = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, id))

    for (const org of ownedOrgs) {
      const [memberCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, org.organizationId))

      if (memberCount && memberCount.count <= 1) {
        await db.delete(organizations).where(eq(organizations.id, org.organizationId))
      }
    }

    await db.delete(users).where(eq(users.id, id))

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete user error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
