// QuickBooks Callback API - DISABLED
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    return NextResponse.json(
      { error: 'QuickBooks integration is disabled' },
      { status: 503 }
    )
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
