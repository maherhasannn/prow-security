import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth, requireOrganizationAccess } from '@/lib/auth/middleware'
import { updateOrganizationSchema } from '@/lib/utils/validation'
import { handleError, NotFoundError } from '@/lib/utils/errors'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'
import { requireRole } from '@/lib/auth/middleware'

/**
 * GET /api/organizations/[id] - Get a specific organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    await requireOrganizationAccess(params.id)

    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, params.id))
      .limit(1)

    if (!organization) {
      throw new NotFoundError('Organization')
    }

    return NextResponse.json({ organization })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * PATCH /api/organizations/[id] - Update an organization
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    await requireOrganizationAccess(params.id)

    // Only admins and owners can update organization
    await requireRole(params.id, 'admin')

    const body = await request.json()
    const validated = updateOrganizationSchema.parse(body)

    // Check slug uniqueness if updating slug
    if (validated.slug) {
      const [existing] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, validated.slug))
        .limit(1)

      if (existing && existing.id !== params.id) {
        return NextResponse.json(
          { error: 'Organization slug already exists' },
          { status: 409 }
        )
      }
    }

    const [updated] = await db
      .update(organizations)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, params.id))
      .returning()

    if (!updated) {
      throw new NotFoundError('Organization')
    }

    // Log audit event
    await logAuditEvent({
      organizationId: params.id,
      userId: session.user.id,
      action: 'organization_update',
      resourceType: 'organization',
      resourceId: params.id,
      metadata: validated,
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ organization: updated })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

