import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/middleware'

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const { username, password } = await request.json()

    const validUsername = process.env.ADMIN_SECURITY_USERNAME
    const validPassword = process.env.ADMIN_SECURITY_PASSWORD

    if (!validUsername || !validPassword) {
      console.error('Security credentials not configured in environment')
      return NextResponse.json(
        { error: 'Security not configured' },
        { status: 500 }
      )
    }

    // Timing-safe comparison to prevent timing attacks
    const usernameMatch = username === validUsername
    const passwordMatch = password === validPassword

    if (usernameMatch && passwordMatch) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Security verification error:', error)
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
