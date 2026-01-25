import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'

export interface AuditLogData {
  organizationId: string
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Logs an audit event (non-blocking)
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      organizationId: data.organizationId,
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    })
  } catch (error) {
    // Log error but don't throw - audit logging should never break the request
    console.error('Failed to log audit event:', error)
  }
}

/**
 * Gets audit logs for an organization with pagination
 */
export async function getAuditLogs(
  organizationId: string,
  options: {
    page?: number
    limit?: number
    action?: string
    resourceType?: string
    userId?: string
    startDate?: Date
    endDate?: Date
  } = {}
) {
  const {
    page = 1,
    limit = 50,
    action,
    resourceType,
    userId,
    startDate,
    endDate,
  } = options

  const offset = (page - 1) * limit

  const conditions = [eq(auditLogs.organizationId, organizationId)]

  if (action) {
    conditions.push(eq(auditLogs.action, action))
  }

  if (resourceType) {
    conditions.push(eq(auditLogs.resourceType, resourceType))
  }

  if (userId) {
    conditions.push(eq(auditLogs.userId, userId))
  }

  if (startDate) {
    conditions.push(gte(auditLogs.createdAt, startDate))
  }

  if (endDate) {
    conditions.push(lte(auditLogs.createdAt, endDate))
  }

  const logs = await db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset)

  const [totalCount] = await db
    .select({ count: auditLogs.id })
    .from(auditLogs)
    .where(and(...conditions))

  return {
    logs,
    pagination: {
      page,
      limit,
      total: totalCount?.count ? Number(totalCount.count) : 0,
      totalPages: Math.ceil((totalCount?.count ? Number(totalCount.count) : 0) / limit),
    },
  }
}

/**
 * Helper to extract IP address from request
 */
export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || undefined
}

/**
 * Helper to extract user agent from request
 */
export function getClientUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}



