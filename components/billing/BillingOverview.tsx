'use client'

import { motion } from 'framer-motion'
import { Crown, Calendar, Users, FolderOpen, FileText, Zap } from 'lucide-react'

interface Subscription {
  id: string
  planId: string
  status: string
  billingInterval: 'monthly' | 'yearly'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  plan: {
    id: string
    name: string
    type: string
    priceMonthly: number
    priceYearly: number
    maxSeats: number
    maxWorkspaces: number
    maxDocuments: number
    features: string[]
  }
}

interface BillingOverviewProps {
  subscription: Subscription | null
  onUpgradeClick: () => void
}

export default function BillingOverview({
  subscription,
  onUpgradeClick,
}: BillingOverviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  if (!subscription) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background-alt border border-text/10 rounded-sm p-12 text-center"
      >
        <Crown className="w-12 h-12 mx-auto mb-4 text-text/40" />
        <h3 className="text-xl font-heading font-semibold mb-2">
          No Active Subscription
        </h3>
        <p className="text-text/70 mb-6">
          Get started by selecting a plan that fits your needs
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onUpgradeClick}
          className="px-6 py-3 bg-text text-background font-medium rounded-sm hover:bg-accent transition-colors"
        >
          View Plans
        </motion.button>
      </motion.div>
    )
  }

  const currentPrice =
    subscription.billingInterval === 'monthly'
      ? subscription.plan.priceMonthly
      : subscription.plan.priceYearly

  return (
    <div className="space-y-8">
      {/* Current Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background-alt border border-text/10 rounded-sm p-8"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-accent uppercase tracking-wider">
                Current Plan
              </span>
            </div>
            <h2 className="text-3xl font-heading font-bold mb-1">
              {subscription.plan.name}
            </h2>
            <p className="text-text/70">
              {subscription.plan.type === 'free'
                ? 'Free forever'
                : `${formatPrice(currentPrice)}/${subscription.billingInterval === 'monthly' ? 'month' : 'year'}`}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 text-sm font-medium rounded-sm ${
                subscription.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : subscription.status === 'canceled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </span>
            {subscription.cancelAtPeriodEnd && (
              <p className="text-sm text-red-600 mt-2">
                Cancels on {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
          </div>
        </div>

        {subscription.plan.type !== 'free' && (
          <div className="flex items-center gap-2 text-sm text-text/70 mb-6">
            <Calendar className="w-4 h-4" />
            <span>
              Current period: {formatDate(subscription.currentPeriodStart)} -{' '}
              {formatDate(subscription.currentPeriodEnd)}
            </span>
          </div>
        )}

        {subscription.plan.type !== 'enterprise' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUpgradeClick}
            className="w-full py-3 bg-text text-background font-medium rounded-sm hover:bg-accent transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Upgrade Plan
          </motion.button>
        )}
      </motion.div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-background-alt border border-text/10 rounded-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-sm">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-medium">Team Seats</span>
          </div>
          <p className="text-3xl font-heading font-bold mb-1">
            {subscription.plan.maxSeats === -1
              ? 'Unlimited'
              : subscription.plan.maxSeats}
          </p>
          <p className="text-sm text-text/60">Maximum allowed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-background-alt border border-text/10 rounded-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-sm">
              <FolderOpen className="w-5 h-5 text-purple-600" />
            </div>
            <span className="font-medium">Workspaces</span>
          </div>
          <p className="text-3xl font-heading font-bold mb-1">
            {subscription.plan.maxWorkspaces === -1
              ? 'Unlimited'
              : subscription.plan.maxWorkspaces}
          </p>
          <p className="text-sm text-text/60">Maximum allowed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-background-alt border border-text/10 rounded-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-sm">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-medium">Documents</span>
          </div>
          <p className="text-3xl font-heading font-bold mb-1">
            {subscription.plan.maxDocuments === -1
              ? 'Unlimited'
              : subscription.plan.maxDocuments}
          </p>
          <p className="text-sm text-text/60">Maximum allowed</p>
        </motion.div>
      </div>

      {/* Features List */}
      {subscription.plan.features.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-background-alt border border-text/10 rounded-sm p-6"
        >
          <h3 className="font-heading font-semibold mb-4">Plan Features</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subscription.plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-text/70">
                <span className="text-accent">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}
