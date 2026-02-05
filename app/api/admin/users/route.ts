import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth/middleware'
import { sql, desc, asc, gte, lte, like, or } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const minTokens = searchParams.get('minTokens')
    const maxTokens = searchParams.get('maxTokens')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const offset = (page - 1) * limit

    // Build conditions
    const conditions = []

    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.name, `%${search}%`)
        )
      )
    }

    if (minTokens) {
      conditions.push(gte(users.tokensUsed, parseInt(minTokens)))
    }

    if (maxTokens) {
      conditions.push(lte(users.tokensUsed, parseInt(maxTokens)))
    }

    if (dateFrom) {
      conditions.push(gte(users.createdAt, new Date(dateFrom)))
    }

    if (dateTo) {
      conditions.push(lte(users.createdAt, new Date(dateTo)))
    }

    // Build order
    const sortColumn = {
      createdAt: users.createdAt,
      email: users.email,
      name: users.name,
      tokensUsed: users.tokensUsed,
      loginCount: users.loginCount,
      lastLoginAt: users.lastLoginAt,
    }[sortBy] || users.createdAt

    const orderFn = sortOrder === 'asc' ? asc : desc

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)::int` }).from(users)
    if (conditions.length > 0) {
      // @ts-expect-error - drizzle types
      countQuery = countQuery.where(sql`${conditions.map((c, i) => i === 0 ? c : sql` AND ${c}`).reduce((a, b) => sql`${a}${b}`)}`)
    }
    const [countResult] = await countQuery

    // Get users
    let query = db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        isAdmin: users.isAdmin,
        loginCount: users.loginCount,
        lastLoginAt: users.lastLoginAt,
        tokensUsed: users.tokensUsed,
        createdAt: users.createdAt,
      })
      .from(users)

    if (conditions.length > 0) {
      // @ts-expect-error - drizzle types
      query = query.where(sql`${conditions.map((c, i) => i === 0 ? c : sql` AND ${c}`).reduce((a, b) => sql`${a}${b}`)}`)
    }

    const usersList = await query
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      users: usersList,
      pagination: {
        page,
        limit,
        total: countResult?.count ?? 0,
        totalPages: Math.ceil((countResult?.count ?? 0) / limit),
      },
    })
  } catch (error) {
    console.error('Admin users error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
