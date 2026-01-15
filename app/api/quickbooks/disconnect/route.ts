// QuickBooks Disconnect API - DISABLED
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth()
    await getUserOrganizationId()

    return NextResponse.json(
      { error: 'QuickBooks integration is disabled' },
      { status: 503 }
    )
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
