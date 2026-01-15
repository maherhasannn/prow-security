import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { quickbooksConnections } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'
import { exchangeQuickBooksCode } from '@/lib/quickbooks/oauth'
import { encrypt } from '@/lib/storage/encryption'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'

/**
 * GET /api/quickbooks/callback - Handle QuickBooks OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const realmId = url.searchParams.get('realmId')

    if (!code || !state || !realmId) {
      return NextResponse.json(
        { error: 'Missing required OAuth parameters' },
        { status: 400 }
      )
    }

    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    const { workspaceId, organizationId } = stateData

    // Verify user matches state
    if (stateData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Invalid state token' },
        { status: 403 }
      )
    }

    // Exchange code for tokens
    const tokens = await exchangeQuickBooksCode(code, realmId)

    // Encrypt tokens
    const encryptedAccessToken = encrypt(tokens.accessToken, organizationId)
    const encryptedRefreshToken = encrypt(tokens.refreshToken, organizationId)

    // Check if connection already exists
    const [existing] = await db
      .select()
      .from(quickbooksConnections)
      .where(
        and(
          eq(quickbooksConnections.workspaceId, workspaceId),
          eq(quickbooksConnections.organizationId, organizationId)
        )
      )
      .limit(1)

    if (existing) {
      // Update existing connection
      await db
        .update(quickbooksConnections)
        .set({
          accessToken: JSON.stringify(encryptedAccessToken),
          refreshToken: JSON.stringify(encryptedRefreshToken),
          realmId: tokens.realmId,
          expiresAt: tokens.expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(quickbooksConnections.id, existing.id))
    } else {
      // Create new connection
      await db.insert(quickbooksConnections).values({
        organizationId,
        workspaceId,
        accessToken: JSON.stringify(encryptedAccessToken),
        refreshToken: JSON.stringify(encryptedRefreshToken),
        realmId: tokens.realmId,
        expiresAt: tokens.expiresAt,
      })
    }

    // Log audit event
    await logAuditEvent({
      organizationId,
      userId: session.user.id,
      action: 'quickbooks_connect',
      resourceType: 'quickbooks_connection',
      metadata: { workspaceId, realmId },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    // Return success response (frontend should handle redirect)
    return NextResponse.json({
      success: true,
      workspaceId,
      message: 'QuickBooks connected successfully',
    })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

