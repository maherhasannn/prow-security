import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userFlags, users, auditLogs } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth/middleware'
import { desc, eq, sql, and } from 'drizzle-orm'

// GET all flags
export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const showResolved = searchParams.get('showResolved') === 'true'
    const severity = searchParams.get('severity')

    const conditions = []
    if (!showResolved) {
      conditions.push(eq(userFlags.isResolved, false))
    }

    const flags = await db
      .select({
        id: userFlags.id,
        flagType: userFlags.flagType,
        severity: userFlags.severity,
        description: userFlags.description,
        metadata: userFlags.metadata,
        isResolved: userFlags.isResolved,
        resolvedAt: userFlags.resolvedAt,
        createdAt: userFlags.createdAt,
        userId: userFlags.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(userFlags)
      .innerJoin(users, eq(userFlags.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(userFlags.createdAt))
      .limit(100)

    // Get counts by severity
    const severityCounts = await db
      .select({
        severity: userFlags.severity,
        count: sql<number>`count(*)::int`,
      })
      .from(userFlags)
      .where(eq(userFlags.isResolved, false))
      .groupBy(userFlags.severity)

    return NextResponse.json({
      flags,
      severityCounts,
    })
  } catch (error) {
    console.error('Admin flags error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 })
  }
}

// POST create a flag manually
export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const body = await request.json()

    const { userId, flagType, severity, description } = body

    if (!userId || !flagType || !severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const [flag] = await db
      .insert(userFlags)
      .values({
        userId,
        flagType,
        severity,
        description,
      })
      .returning()

    // Log the action
    if (session.user.organizationId) {
      await db.insert(auditLogs).values({
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'admin_flag_create',
        resourceType: 'user_flag',
        resourceId: flag.id,
        metadata: { flaggedUserId: userId, flagType, severity },
      })
    }

    return NextResponse.json({ success: true, flag })
  } catch (error) {
    console.error('Admin create flag error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to create flag' }, { status: 500 })
  }
}

// PATCH resolve a flag
export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin()
    const body = await request.json()

    const { flagId, isResolved } = body

    if (!flagId) {
      return NextResponse.json({ error: 'Flag ID required' }, { status: 400 })
    }

    const [flag] = await db
      .update(userFlags)
      .set({
        isResolved: isResolved ?? true,
        resolvedBy: session.user.id,
        resolvedAt: isResolved ? new Date() : null,
      })
      .where(eq(userFlags.id, flagId))
      .returning()

    if (!flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
    }

    // Log the action
    if (session.user.organizationId) {
      await db.insert(auditLogs).values({
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: isResolved ? 'admin_flag_resolve' : 'admin_flag_reopen',
        resourceType: 'user_flag',
        resourceId: flagId,
      })
    }

    return NextResponse.json({ success: true, flag })
  } catch (error) {
    console.error('Admin resolve flag error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to resolve flag' }, { status: 500 })
  }
}
