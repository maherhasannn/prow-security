import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, aiMessages } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth/middleware'
import { sql, gte } from 'drizzle-orm'

export async function GET() {
  try {
    await requireAdmin()

    // Get total users
    const [totalUsersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)

    // Get users signed up in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [newUsersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgo))

    // Get total tokens used
    const [totalTokensResult] = await db
      .select({ total: sql<number>`coalesce(sum(tokens_used), 0)::int` })
      .from(users)

    // Get total AI messages (as engagement metric)
    const [totalMessagesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiMessages)

    // Get users active in last 24 hours
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const [activeUsersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.lastLoginAt, oneDayAgo))

    // Get total logins
    const [totalLoginsResult] = await db
      .select({ total: sql<number>`coalesce(sum(login_count), 0)::int` })
      .from(users)

    return NextResponse.json({
      totalUsers: totalUsersResult?.count ?? 0,
      newUsersLast7Days: newUsersResult?.count ?? 0,
      totalTokensUsed: totalTokensResult?.total ?? 0,
      totalAiMessages: totalMessagesResult?.count ?? 0,
      activeUsersLast24h: activeUsersResult?.count ?? 0,
      totalLogins: totalLoginsResult?.total ?? 0,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
