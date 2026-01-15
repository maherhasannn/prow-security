import { NextResponse } from 'next/server'
import { getAvailableProviders } from '@/lib/ai/providers'

/**
 * GET /api/ai/providers - List available AI providers
 */
export async function GET() {
  try {
    const providers = getAvailableProviders()
    return NextResponse.json({ providers })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get providers' },
      { status: 500 }
    )
  }
}

