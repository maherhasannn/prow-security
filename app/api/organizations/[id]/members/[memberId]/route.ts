import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizationMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth, requireOrganizationAccess } from '@/lib/auth/middleware'
import { updateOrganizationMemberSchema } from '@/lib/utils/validation'
import { handleError, NotFoundError } from '@/lib/utils/errors'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'
import { requireRole } from '@/lib/auth/middleware'

/**
 * PATCH /api/organizations/[id]/members/[memberId] - Update member role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await requireAuth()
    await requireOrganizationAccess(params.id)

    // Only admins and owners can update member roles
    await requireRole(params.id, 'admin')

    const body = await request.json()
    const validated = updateOrganizationMemberSchema.parse(body)

    // Prevent changing owner role (only one owner should exist)
    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.id, params.memberId))
      .limit(1)

    if (!member) {
      throw new NotFoundError('Member')
    }

    if (member.role === 'owner' && validated.role !== 'owner') {
      return NextResponse.json(
        { error: 'Cannot change owner role' },
        { status: 400 }
      )
    }

    const [updated] = await db
      .update(organizationMembers)
      .set({ role: validated.role })
      .where(eq(organizationMembers.id, params.memberId))
      .returning()

    // Log audit event
    await logAuditEvent({
      organizationId: params.id,
      userId: session.user.id,
      action: 'member_update',
      resourceType: 'member',
      resourceId: params.memberId,
      metadata: {
        oldRole: member.role,
        newRole: validated.role,
      },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ member: updated })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * DELETE /api/organizations/[id]/members/[memberId] - Remove a member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await requireAuth()
    await requireOrganizationAccess(params.id)

    // Only admins and owners can remove members
    await requireRole(params.id, 'admin')

    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.id, params.memberId))
      .limit(1)

    if (!member) {
      throw new NotFoundError('Member')
    }

    // Prevent removing owner
    if (member.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove owner' },
        { status: 400 }
      )
    }

    await db.delete(organizationMembers).where(eq(organizationMembers.id, params.memberId))

    // Log audit event
    await logAuditEvent({
      organizationId: params.id,
      userId: session.user.id,
      action: 'member_remove',
      resourceType: 'member',
      resourceId: params.memberId,
      metadata: {
        removedUserId: member.userId,
        role: member.role,
      },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

