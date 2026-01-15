import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { quickbooksConnections } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { fetchQuickBooksDataSchema } from '@/lib/utils/validation'
import { handleError, NotFoundError } from '@/lib/utils/errors'
import { requireWorkspaceAccess } from '@/lib/rbac/checks'
import { decrypt } from '@/lib/storage/encryption'
import {
  fetchProfitAndLossReport,
  fetchBalanceSheetReport,
  fetchTransactions,
  fetchAccounts,
  type QuickBooksTokens,
} from '@/lib/quickbooks/client'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'

/**
 * GET /api/quickbooks/data - Fetch QuickBooks data (read-only)
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

    // Get QuickBooks connection
    const [connection] = await db
      .select()
      .from(quickbooksConnections)
      .where(
        and(
          eq(quickbooksConnections.workspaceId, workspaceId),
          eq(quickbooksConnections.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!connection) {
      throw new NotFoundError('QuickBooks connection')
    }

    // Decrypt tokens
    const encryptedAccessToken = JSON.parse(connection.accessToken) as {
      encrypted: string
      iv: string
      tag: string
    }
    const encryptedRefreshToken = JSON.parse(connection.refreshToken) as {
      encrypted: string
      iv: string
      tag: string
    }

    const tokens: QuickBooksTokens = {
      accessToken: decrypt(
        encryptedAccessToken.encrypted,
        encryptedAccessToken.iv,
        encryptedAccessToken.tag,
        organizationId
      ),
      refreshToken: decrypt(
        encryptedRefreshToken.encrypted,
        encryptedRefreshToken.iv,
        encryptedRefreshToken.tag,
        organizationId
      ),
      expiresAt: connection.expiresAt,
      realmId: connection.realmId,
    }

    // Parse query parameters
    const validated = fetchQuickBooksDataSchema.parse({
      reportType: url.searchParams.get('reportType'),
      startDate: url.searchParams.get('startDate'),
      endDate: url.searchParams.get('endDate'),
    })

    let data

    // Fetch data based on report type
    switch (validated.reportType) {
      case 'profit_and_loss':
        data = await fetchProfitAndLossReport(
          tokens,
          organizationId,
          validated.startDate,
          validated.endDate
        )
        break
      case 'balance_sheet':
        data = await fetchBalanceSheetReport(
          tokens,
          organizationId,
          validated.endDate
        )
        break
      case 'transactions':
        data = await fetchTransactions(
          tokens,
          organizationId,
          validated.startDate,
          validated.endDate
        )
        break
      case 'accounts':
        data = await fetchAccounts(tokens, organizationId)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    // Log audit event
    await logAuditEvent({
      organizationId,
      userId: session.user.id,
      action: 'quickbooks_data_fetch',
      resourceType: 'quickbooks_connection',
      resourceId: connection.id,
      metadata: {
        reportType: validated.reportType,
        workspaceId,
      },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ data })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

