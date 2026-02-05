import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ipWhitelist, auditLogs } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth/middleware'
import { eq, desc } from 'drizzle-orm'

// GET all whitelisted IPs
export async function GET() {
  try {
    await requireAdmin()

    const ips = await db
      .select()
      .from(ipWhitelist)
      .orderBy(desc(ipWhitelist.createdAt))

    return NextResponse.json({ ips })
  } catch (error) {
    console.error('Admin whitelist error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to fetch whitelist' }, { status: 500 })
  }
}

// POST add IP to whitelist
export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const body = await request.json()

    const { ipAddress, description } = body

    if (!ipAddress) {
      return NextResponse.json({ error: 'IP address required' }, { status: 400 })
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/
    if (!ipRegex.test(ipAddress)) {
      return NextResponse.json({ error: 'Invalid IP address format' }, { status: 400 })
    }

    const [ip] = await db
      .insert(ipWhitelist)
      .values({
        ipAddress,
        description,
        createdBy: session.user.id,
      })
      .returning()

    // Log the action
    if (session.user.organizationId) {
      await db.insert(auditLogs).values({
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'admin_whitelist_add',
        resourceType: 'ip_whitelist',
        resourceId: ip.id,
        metadata: { ipAddress },
      })
    }

    return NextResponse.json({ success: true, ip })
  } catch (error) {
    console.error('Admin add whitelist error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to add IP' }, { status: 500 })
  }
}

// DELETE remove IP from whitelist
export async function DELETE(request: Request) {
  try {
    const session = await requireAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'IP ID required' }, { status: 400 })
    }

    const [deleted] = await db
      .delete(ipWhitelist)
      .where(eq(ipWhitelist.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: 'IP not found' }, { status: 404 })
    }

    // Log the action
    if (session.user.organizationId) {
      await db.insert(auditLogs).values({
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'admin_whitelist_remove',
        resourceType: 'ip_whitelist',
        resourceId: id,
        metadata: { ipAddress: deleted.ipAddress },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin remove whitelist error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to remove IP' }, { status: 500 })
  }
}

// PATCH toggle IP active status
export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin()
    const body = await request.json()

    const { id, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'IP ID required' }, { status: 400 })
    }

    const [ip] = await db
      .update(ipWhitelist)
      .set({ isActive })
      .where(eq(ipWhitelist.id, id))
      .returning()

    if (!ip) {
      return NextResponse.json({ error: 'IP not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, ip })
  } catch (error) {
    console.error('Admin toggle whitelist error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to toggle IP' }, { status: 500 })
  }
}
