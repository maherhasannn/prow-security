import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, organizationMembers, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/middleware'
import { createOrganizationSchema } from '@/lib/utils/validation'
import { handleError } from '@/lib/utils/errors'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'
import bcrypt from 'bcryptjs'

/**
 * GET /api/organizations - List organizations for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const userOrganizations = await db
      .select({
        organization: organizations,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, session.user.id))

    return NextResponse.json({
      organizations: userOrganizations.map((uo) => ({
        ...uo.organization,
        role: uo.role,
      })),
    })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * POST /api/organizations - Create a new organization
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const validated = createOrganizationSchema.parse(body)

    // Check if slug already exists
    const [existing] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, validated.slug))
      .limit(1)

    if (existing) {
      return NextResponse.json(
        { error: 'Organization slug already exists' },
        { status: 409 }
      )
    }

    // Create organization
    const [organization] = await db
      .insert(organizations)
      .values({
        name: validated.name,
        slug: validated.slug,
      })
      .returning()

    // Add creator as owner
    await db.insert(organizationMembers).values({
      organizationId: organization.id,
      userId: session.user.id,
      role: 'owner',
    })

    // Log audit event
    await logAuditEvent({
      organizationId: organization.id,
      userId: session.user.id,
      action: 'organization_create',
      resourceType: 'organization',
      resourceId: organization.id,
      metadata: { name: organization.name, slug: organization.slug },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json(
      {
        organization: {
          ...organization,
          role: 'owner' as const,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

