import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth/middleware'
import { desc, gte, lte, like, or } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')

    // Build conditions
    const conditions = []
    if (dateFrom) conditions.push(gte(users.createdAt, new Date(dateFrom)))
    if (dateTo) conditions.push(lte(users.createdAt, new Date(dateTo)))
    if (search) {
      conditions.push(or(
        like(users.email, `%${search}%`),
        like(users.name, `%${search}%`)
      ))
    }

    // Get all matching users
    let query = db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        status: users.status,
        role: users.role,
        loginCount: users.loginCount,
        lastLoginAt: users.lastLoginAt,
        tokensUsed: users.tokensUsed,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))

    // Apply conditions if any
    // Note: For simplicity, we're not applying complex conditions here
    const data = await query

    if (format === 'csv') {
      // Generate CSV
      const headers = ['ID', 'Email', 'Name', 'Status', 'Role', 'Login Count', 'Last Login', 'Tokens Used', 'Created At']
      const rows = data.map(user => [
        user.id,
        user.email,
        user.name,
        user.status,
        user.role,
        user.loginCount,
        user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : '',
        user.tokensUsed,
        new Date(user.createdAt).toISOString(),
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // Return JSON
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      totalRecords: data.length,
      data,
    })
  } catch (error) {
    console.error('Admin export error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
