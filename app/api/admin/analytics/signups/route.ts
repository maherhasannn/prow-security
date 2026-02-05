import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth/middleware'
import { sql, gte } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days

    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))

    // Get daily signups for the period
    const signups = await db
      .select({
        date: sql<string>`date_trunc('day', ${users.createdAt})::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(gte(users.createdAt, daysAgo))
      .groupBy(sql`date_trunc('day', ${users.createdAt})`)
      .orderBy(sql`date_trunc('day', ${users.createdAt})`)

    // Fill in missing dates with zero counts
    const filledData = []
    const currentDate = new Date(daysAgo)
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const signupMap = new Map(signups.map(s => [s.date, s.count]))

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0]
      filledData.push({
        date: dateStr,
        count: signupMap.get(dateStr) || 0,
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return NextResponse.json({ signups: filledData })
  } catch (error) {
    console.error('Admin signups analytics error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch signup analytics' }, { status: 500 })
  }
}
