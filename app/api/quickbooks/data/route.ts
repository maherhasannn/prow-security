// QuickBooks Data API - DISABLED
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'
import { requireWorkspaceAccess } from '@/lib/rbac/checks'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const url = new URL(request.url)
    const workspaceId = url.searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      )
    }

    await requireWorkspaceAccess(workspaceId, organizationId, session.user.id)

    return NextResponse.json(
      { error: 'QuickBooks integration is disabled' },
      { status: 503 }
    )
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
