import { db } from '@/lib/db'
import {
  subscriptions,
  subscriptionPlans,
  billingCustomers,
  payments,
} from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { NotFoundError, PaymentError } from '@/lib/utils/errors'
import type { BillingInterval, Subscription, SubscriptionPlan } from './types'

/**
 * Get all active subscription plans.
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const plans = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true))
    .orderBy(subscriptionPlans.priceMonthly)

  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    type: plan.type,
    description: plan.description,
    priceMonthly: plan.priceMonthly,
    priceYearly: plan.priceYearly,
    maxSeats: plan.maxSeats,
    maxWorkspaces: plan.maxWorkspaces,
    maxDocuments: plan.maxDocuments,
    features: (plan.features as string[]) || [],
    isActive: plan.isActive,
  }))
}

/**
 * Get a subscription plan by ID.
 */
export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlan> {
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, planId))
    .limit(1)

  if (!plan) {
    throw new NotFoundError('Subscription plan')
  }

  return {
    id: plan.id,
    name: plan.name,
    type: plan.type,
    description: plan.description,
    priceMonthly: plan.priceMonthly,
    priceYearly: plan.priceYearly,
    maxSeats: plan.maxSeats,
    maxWorkspaces: plan.maxWorkspaces,
    maxDocuments: plan.maxDocuments,
    features: (plan.features as string[]) || [],
    isActive: plan.isActive,
  }
}

/**
 * Get the free plan.
 */
export async function getFreePlan(): Promise<SubscriptionPlan | null> {
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(
      and(eq(subscriptionPlans.type, 'free'), eq(subscriptionPlans.isActive, true))
    )
    .limit(1)

  if (!plan) return null

  return {
    id: plan.id,
    name: plan.name,
    type: plan.type,
    description: plan.description,
    priceMonthly: plan.priceMonthly,
    priceYearly: plan.priceYearly,
    maxSeats: plan.maxSeats,
    maxWorkspaces: plan.maxWorkspaces,
    maxDocuments: plan.maxDocuments,
    features: (plan.features as string[]) || [],
    isActive: plan.isActive,
  }
}

/**
 * Get the current subscription for an organization.
 */
export async function getOrganizationSubscription(
  organizationId: string
): Promise<(Subscription & { plan: SubscriptionPlan }) | null> {
  const [result] = await db
    .select({
      subscription: subscriptions,
      plan: subscriptionPlans,
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1)

  if (!result) return null

  const { subscription, plan } = result

  return {
    id: subscription.id,
    organizationId: subscription.organizationId,
    planId: subscription.planId,
    status: subscription.status,
    billingInterval: subscription.billingInterval,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    canceledAt: subscription.canceledAt,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    trialStart: subscription.trialStart,
    trialEnd: subscription.trialEnd,
    plan: {
      id: plan.id,
      name: plan.name,
      type: plan.type,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      maxSeats: plan.maxSeats,
      maxWorkspaces: plan.maxWorkspaces,
      maxDocuments: plan.maxDocuments,
      features: (plan.features as string[]) || [],
      isActive: plan.isActive,
    },
  }
}

/**
 * Create a free subscription for an organization.
 * Called when an organization is first created or when selecting free plan.
 */
export async function createFreeSubscription(
  organizationId: string
): Promise<Subscription> {
  const freePlan = await getFreePlan()

  if (!freePlan) {
    throw new Error('Free plan not found. Please run the seed script.')
  }

  // Check if subscription already exists
  const existing = await getOrganizationSubscription(organizationId)
  if (existing) {
    throw new PaymentError('Organization already has a subscription')
  }

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setFullYear(periodEnd.getFullYear() + 100) // Free plan doesn't expire

  const [subscription] = await db
    .insert(subscriptions)
    .values({
      organizationId,
      planId: freePlan.id,
      status: 'active',
      billingInterval: 'monthly',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    })
    .returning()

  return {
    id: subscription.id,
    organizationId: subscription.organizationId,
    planId: subscription.planId,
    status: subscription.status,
    billingInterval: subscription.billingInterval,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    canceledAt: subscription.canceledAt,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    trialStart: subscription.trialStart,
    trialEnd: subscription.trialEnd,
  }
}

/**
 * Create or update a subscription after successful payment.
 */
export async function activateSubscription(
  organizationId: string,
  planId: string,
  billingInterval: BillingInterval
): Promise<Subscription> {
  const plan = await getSubscriptionPlan(planId)

  const now = new Date()
  const periodEnd = new Date(now)

  if (billingInterval === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  }

  // Check if subscription exists
  const existing = await getOrganizationSubscription(organizationId)

  if (existing) {
    // Update existing subscription
    const [updated] = await db
      .update(subscriptions)
      .set({
        planId,
        status: 'active',
        billingInterval,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        updatedAt: now,
      })
      .where(eq(subscriptions.organizationId, organizationId))
      .returning()

    return {
      id: updated.id,
      organizationId: updated.organizationId,
      planId: updated.planId,
      status: updated.status,
      billingInterval: updated.billingInterval,
      currentPeriodStart: updated.currentPeriodStart,
      currentPeriodEnd: updated.currentPeriodEnd,
      canceledAt: updated.canceledAt,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      trialStart: updated.trialStart,
      trialEnd: updated.trialEnd,
    }
  } else {
    // Create new subscription
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        organizationId,
        planId,
        status: 'active',
        billingInterval,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      })
      .returning()

    return {
      id: subscription.id,
      organizationId: subscription.organizationId,
      planId: subscription.planId,
      status: subscription.status,
      billingInterval: subscription.billingInterval,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      canceledAt: subscription.canceledAt,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      trialStart: subscription.trialStart,
      trialEnd: subscription.trialEnd,
    }
  }
}

/**
 * Cancel a subscription.
 */
export async function cancelSubscription(
  organizationId: string,
  cancelImmediately: boolean = false
): Promise<Subscription> {
  const existing = await getOrganizationSubscription(organizationId)

  if (!existing) {
    throw new NotFoundError('Subscription')
  }

  const now = new Date()

  if (cancelImmediately) {
    // Downgrade to free plan immediately
    const freePlan = await getFreePlan()

    if (!freePlan) {
      throw new Error('Free plan not found')
    }

    const [updated] = await db
      .update(subscriptions)
      .set({
        planId: freePlan.id,
        status: 'canceled',
        canceledAt: now,
        cancelAtPeriodEnd: false,
        updatedAt: now,
      })
      .where(eq(subscriptions.organizationId, organizationId))
      .returning()

    return {
      id: updated.id,
      organizationId: updated.organizationId,
      planId: updated.planId,
      status: updated.status,
      billingInterval: updated.billingInterval,
      currentPeriodStart: updated.currentPeriodStart,
      currentPeriodEnd: updated.currentPeriodEnd,
      canceledAt: updated.canceledAt,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      trialStart: updated.trialStart,
      trialEnd: updated.trialEnd,
    }
  } else {
    // Cancel at end of current period
    const [updated] = await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        canceledAt: now,
        updatedAt: now,
      })
      .where(eq(subscriptions.organizationId, organizationId))
      .returning()

    return {
      id: updated.id,
      organizationId: updated.organizationId,
      planId: updated.planId,
      status: updated.status,
      billingInterval: updated.billingInterval,
      currentPeriodStart: updated.currentPeriodStart,
      currentPeriodEnd: updated.currentPeriodEnd,
      canceledAt: updated.canceledAt,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      trialStart: updated.trialStart,
      trialEnd: updated.trialEnd,
    }
  }
}

/**
 * Get or create a billing customer for an organization.
 */
export async function getOrCreateBillingCustomer(
  organizationId: string,
  email: string,
  name?: string
) {
  const [existing] = await db
    .select()
    .from(billingCustomers)
    .where(eq(billingCustomers.organizationId, organizationId))
    .limit(1)

  if (existing) {
    return existing
  }

  const [customer] = await db
    .insert(billingCustomers)
    .values({
      organizationId,
      email,
      name,
    })
    .returning()

  return customer
}

/**
 * Get payment history for an organization.
 */
export async function getPaymentHistory(
  organizationId: string,
  options: {
    page?: number
    limit?: number
    status?: string
    startDate?: Date
    endDate?: Date
  } = {}
) {
  const { page = 1, limit = 20 } = options
  const offset = (page - 1) * limit

  let query = db
    .select()
    .from(payments)
    .where(eq(payments.organizationId, organizationId))
    .orderBy(desc(payments.createdAt))
    .limit(limit)
    .offset(offset)

  const results = await query

  // Get total count for pagination
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(payments)
    .where(eq(payments.organizationId, organizationId))

  return {
    payments: results,
    pagination: {
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
    },
  }
}

/**
 * Calculate the price for a plan based on billing interval.
 */
export function calculatePlanPrice(
  plan: SubscriptionPlan,
  billingInterval: BillingInterval
): number {
  return billingInterval === 'monthly' ? plan.priceMonthly : plan.priceYearly
}
