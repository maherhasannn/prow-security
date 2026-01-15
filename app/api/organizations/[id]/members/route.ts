import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizationMembers, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, requireOrganizationAccess } from '@/lib/auth/middleware'
import { addOrganizationMemberSchema } from '@/lib/utils/validation'
import { handleError, NotFoundError } from '@/lib/utils/errors'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'
import { requireRole } from '@/lib/auth/middleware'

/**
 * GET /api/organizations/[id]/members - List organization members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    await requireOrganizationAccess(params.id)

    const members = await db
      .select({
        id: organizationMembers.id,
        role: organizationMembers.role,
        createdAt: organizationMembers.createdAt,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
        },
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, params.id))
      .orderBy(organizationMembers.createdAt)

    return NextResponse.json({ members })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * POST /api/organizations/[id]/members - Add a member to the organization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    await requireOrganizationAccess(params.id)

    // Only admins and owners can add members
    await requireRole(params.id, 'admin')

    const body = await request.json()
    const validated = addOrganizationMemberSchema.parse(body)

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const [existing] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, params.id),
          eq(organizationMembers.userId, user.id)
        )
      )
      .limit(1)

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 409 }
      )
    }

    // Add member
    const [member] = await db
      .insert(organizationMembers)
      .values({
        organizationId: params.id,
        userId: user.id,
        role: validated.role,
      })
      .returning()

    // Log audit event
    await logAuditEvent({
      organizationId: params.id,
      userId: session.user.id,
      action: 'member_add',
      resourceType: 'member',
      resourceId: member.id,
      metadata: {
        addedUserId: user.id,
        role: validated.role,
      },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}


