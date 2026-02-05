import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { paymentMethods } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId, requireRole } from '@/lib/auth/middleware'
import { requireBillingEnabled } from '@/lib/payments/middleware'
import { updatePaymentMethodSchema } from '@/lib/payments/validation'
import { handleError, NotFoundError } from '@/lib/utils/errors'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'

/**
 * PATCH /api/payments/methods/[id]
 * Update a payment method (e.g., set as default)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireBillingEnabled()
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()
    const { id } = await params

    // Only admins and owners can modify payment methods
    await requireRole(organizationId, 'admin')

    // Find the payment method
    const [method] = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, id),
          eq(paymentMethods.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!method) {
      throw new NotFoundError('Payment method')
    }

    const body = await request.json()
    const validated = updatePaymentMethodSchema.parse(body)

    // If setting as default, unset all others first
    if (validated.isDefault) {
      await db
        .update(paymentMethods)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(paymentMethods.organizationId, organizationId))
    }

    // Update the method
    const [updated] = await db
      .update(paymentMethods)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(paymentMethods.id, id))
      .returning()

    await logAuditEvent({
      organizationId,
      userId: session.user.id,
      action: 'payment_method_updated',
      resourceType: 'payment_method',
      resourceId: id,
      metadata: validated,
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({
      method: {
        id: updated.id,
        type: updated.type,
        cardLast4: updated.cardLast4,
        cardBrand: updated.cardBrand,
        expMonth: updated.expMonth,
        expYear: updated.expYear,
        isDefault: updated.isDefault,
      },
    })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * DELETE /api/payments/methods/[id]
 * Remove a saved payment method
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireBillingEnabled()
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()
    const { id } = await params

    // Only admins and owners can delete payment methods
    await requireRole(organizationId, 'admin')

    // Find the payment method
    const [method] = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, id),
          eq(paymentMethods.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!method) {
      throw new NotFoundError('Payment method')
    }

    // Delete the payment method
    await db
      .delete(paymentMethods)
      .where(eq(paymentMethods.id, id))

    // If this was the default, make another one default
    if (method.isDefault) {
      const [nextMethod] = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.organizationId, organizationId))
        .limit(1)

      if (nextMethod) {
        await db
          .update(paymentMethods)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(paymentMethods.id, nextMethod.id))
      }
    }

    await logAuditEvent({
      organizationId,
      userId: session.user.id,
      action: 'payment_method_removed',
      resourceType: 'payment_method',
      resourceId: id,
      metadata: {
        cardLast4: method.cardLast4,
        cardBrand: method.cardBrand,
      },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
