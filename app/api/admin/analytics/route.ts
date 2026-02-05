import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, loginHistory } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth/middleware'
import { sql, gte, and, lte } from 'drizzle-orm'

const COST_PER_1K_TOKENS = 0.002 // $0.002 per 1k tokens

export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('period') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Cost analysis
    const [tokenStats] = await db
      .select({
        totalTokens: sql<number>`coalesce(sum(tokens_used), 0)::int`,
        avgTokens: sql<number>`coalesce(avg(tokens_used), 0)::int`,
        maxTokens: sql<number>`coalesce(max(tokens_used), 0)::int`,
      })
      .from(users)

    const estimatedCost = (tokenStats?.totalTokens || 0) / 1000 * COST_PER_1K_TOKENS

    // Retention / Churn analysis (users signed up 30+ days ago who logged in last 7 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [retentionData] = await db
      .select({
        totalOldUsers: sql<number>`count(*) filter (where created_at <= ${thirtyDaysAgo})::int`,
        activeOldUsers: sql<number>`count(*) filter (where created_at <= ${thirtyDaysAgo} and last_login_at >= ${sevenDaysAgo})::int`,
      })
      .from(users)

    const retentionRate = retentionData?.totalOldUsers > 0
      ? (retentionData.activeOldUsers / retentionData.totalOldUsers * 100).toFixed(1)
      : 0

    const churnRate = retentionData?.totalOldUsers > 0
      ? (100 - (retentionData.activeOldUsers / retentionData.totalOldUsers * 100)).toFixed(1)
      : 0

    // Cohort analysis - users by signup week and their activity
    const cohorts = await db
      .select({
        week: sql<string>`date_trunc('week', created_at)::date::text`,
        signups: sql<number>`count(*)::int`,
        stillActive: sql<number>`count(*) filter (where last_login_at >= ${sevenDaysAgo})::int`,
      })
      .from(users)
      .where(gte(users.createdAt, startDate))
      .groupBy(sql`date_trunc('week', created_at)`)
      .orderBy(sql`date_trunc('week', created_at)`)

    // Login heatmap data (hour of day x day of week)
    const heatmapData = await db
      .select({
        dayOfWeek: sql<number>`extract(dow from created_at)::int`,
        hourOfDay: sql<number>`extract(hour from created_at)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(loginHistory)
      .where(gte(loginHistory.createdAt, startDate))
      .groupBy(sql`extract(dow from created_at)`, sql`extract(hour from created_at)`)

    // Token usage over time
    const tokenTrend = await db
      .select({
        date: sql<string>`date_trunc('day', created_at)::date::text`,
        totalTokens: sql<number>`sum(tokens_used)::int`,
        userCount: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(gte(users.createdAt, startDate))
      .groupBy(sql`date_trunc('day', created_at)`)
      .orderBy(sql`date_trunc('day', created_at)`)

    return NextResponse.json({
      costAnalysis: {
        totalTokens: tokenStats?.totalTokens || 0,
        avgTokensPerUser: tokenStats?.avgTokens || 0,
        maxTokensByUser: tokenStats?.maxTokens || 0,
        estimatedCost: estimatedCost.toFixed(2),
        costPer1kTokens: COST_PER_1K_TOKENS,
      },
      retention: {
        totalOldUsers: retentionData?.totalOldUsers || 0,
        activeOldUsers: retentionData?.activeOldUsers || 0,
        retentionRate: Number(retentionRate),
        churnRate: Number(churnRate),
      },
      cohorts,
      heatmap: heatmapData,
      tokenTrend,
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
