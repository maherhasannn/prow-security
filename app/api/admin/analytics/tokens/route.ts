import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth/middleware'
import { sql, desc, gt } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const topCount = parseInt(searchParams.get('top') || '10')

    // Get top token consumers
    const topConsumers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        tokensUsed: users.tokensUsed,
      })
      .from(users)
      .where(gt(users.tokensUsed, 0))
      .orderBy(desc(users.tokensUsed))
      .limit(topCount)

    // Get token usage distribution
    const distribution = await db
      .select({
        range: sql<string>`
          CASE
            WHEN tokens_used = 0 THEN '0'
            WHEN tokens_used BETWEEN 1 AND 100 THEN '1-100'
            WHEN tokens_used BETWEEN 101 AND 1000 THEN '101-1000'
            WHEN tokens_used BETWEEN 1001 AND 10000 THEN '1001-10000'
            ELSE '10000+'
          END
        `,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(sql`
        CASE
          WHEN tokens_used = 0 THEN '0'
          WHEN tokens_used BETWEEN 1 AND 100 THEN '1-100'
          WHEN tokens_used BETWEEN 101 AND 1000 THEN '101-1000'
          WHEN tokens_used BETWEEN 1001 AND 10000 THEN '1001-10000'
          ELSE '10000+'
        END
      `)

    // Get total tokens
    const [totalResult] = await db
      .select({ total: sql<number>`coalesce(sum(tokens_used), 0)::int` })
      .from(users)

    // Get average tokens per user
    const [avgResult] = await db
      .select({ avg: sql<number>`coalesce(avg(tokens_used), 0)::int` })
      .from(users)

    return NextResponse.json({
      topConsumers,
      distribution,
      totalTokens: totalResult?.total ?? 0,
      averageTokensPerUser: avgResult?.avg ?? 0,
    })
  } catch (error) {
    console.error('Admin tokens analytics error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch token analytics' }, { status: 500 })
  }
}
