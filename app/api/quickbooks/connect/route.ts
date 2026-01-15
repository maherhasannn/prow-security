import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'
import { getQuickBooksAuthUrl } from '@/lib/quickbooks/oauth'
import { requireWorkspaceAccess } from '@/lib/rbac/checks'

/**
 * GET /api/quickbooks/connect - Initiate QuickBooks OAuth flow
 */
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

    // Verify workspace access
    await requireWorkspaceAccess(workspaceId, organizationId, session.user.id)

    // Generate state token (include workspaceId and organizationId for callback)
    const state = Buffer.from(
      JSON.stringify({ workspaceId, organizationId, userId: session.user.id })
    ).toString('base64')

    const authUrl = getQuickBooksAuthUrl(state)

    return NextResponse.json({ authUrl, state })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

