'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Zap, Building2, Sparkles } from 'lucide-react'

interface Plan {
  id: string
  name: string
  type: string
  description: string | null
  priceMonthly: number
  priceYearly: number
  maxSeats: number
  maxWorkspaces: number
  maxDocuments: number
  features: string[]
}

interface PlanSelectorProps {
  plans: Plan[]
  currentPlanId?: string
  onSelectPlan: (plan: Plan, interval: 'monthly' | 'yearly') => void
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Sparkles className="w-6 h-6" />,
  starter: <Zap className="w-6 h-6" />,
  professional: <Crown className="w-6 h-6" />,
  enterprise: <Building2 className="w-6 h-6" />,
}

const planColors: Record<string, string> = {
  free: 'text-text/60',
  starter: 'text-blue-600',
  professional: 'text-purple-600',
  enterprise: 'text-amber-600',
}

export default function PlanSelector({
  plans,
  currentPlanId,
  onSelectPlan,
}: PlanSelectorProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free'
    return `$${(cents / 100).toFixed(0)}`
  }

  const getMonthlyEquivalent = (yearlyPrice: number) => {
    return Math.round(yearlyPrice / 12 / 100)
  }

  const getSavingsPercent = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0
    const monthlyTotal = monthly * 12
    const savings = ((monthlyTotal - yearly) / monthlyTotal) * 100
    return Math.round(savings)
  }

  return (
    <div className="space-y-8">
      {/* Billing Interval Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span
          className={`text-sm ${billingInterval === 'monthly' ? 'text-text' : 'text-text/60'}`}
        >
          Monthly
        </span>
        <button
          onClick={() =>
            setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')
          }
          className="relative w-14 h-7 bg-text/10 rounded-full transition-colors"
        >
          <motion.div
            animate={{ x: billingInterval === 'yearly' ? 28 : 4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-5 h-5 bg-text rounded-full"
          />
        </button>
        <span
          className={`text-sm ${billingInterval === 'yearly' ? 'text-text' : 'text-text/60'}`}
        >
          Yearly
          <span className="ml-1 text-green-600 font-medium">Save up to 20%</span>
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, index) => {
          const isCurrent = plan.id === currentPlanId
          const price =
            billingInterval === 'monthly' ? plan.priceMonthly : plan.priceYearly
          const savings = getSavingsPercent(plan.priceMonthly, plan.priceYearly)

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-background-alt border rounded-sm p-6 flex flex-col ${
                plan.type === 'professional'
                  ? 'border-accent ring-2 ring-accent/20'
                  : 'border-text/10'
              }`}
            >
              {plan.type === 'professional' && (
                <div className="text-xs font-semibold uppercase tracking-wider text-accent mb-4">
                  Most Popular
                </div>
              )}

              <div className={`mb-4 ${planColors[plan.type] || 'text-text'}`}>
                {planIcons[plan.type] || <Sparkles className="w-6 h-6" />}
              </div>

              <h3 className="text-xl font-heading font-bold mb-1">{plan.name}</h3>

              <div className="mb-4">
                <span className="text-3xl font-heading font-bold">
                  {formatPrice(price)}
                </span>
                {price > 0 && (
                  <span className="text-text/60">
                    /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                  </span>
                )}
                {billingInterval === 'yearly' && savings > 0 && (
                  <span className="ml-2 text-sm text-green-600 font-medium">
                    ${getMonthlyEquivalent(price)}/mo
                  </span>
                )}
              </div>

              {plan.description && (
                <p className="text-sm text-text/70 mb-6">{plan.description}</p>
              )}

              <ul className="space-y-3 mb-6 flex-grow">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent" />
                  <span>
                    {plan.maxSeats === -1 ? 'Unlimited' : plan.maxSeats} team{' '}
                    {plan.maxSeats === 1 ? 'seat' : 'seats'}
                  </span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent" />
                  <span>
                    {plan.maxWorkspaces === -1 ? 'Unlimited' : plan.maxWorkspaces}{' '}
                    workspace{plan.maxWorkspaces === 1 ? '' : 's'}
                  </span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent" />
                  <span>
                    {plan.maxDocuments === -1 ? 'Unlimited' : plan.maxDocuments}{' '}
                    document{plan.maxDocuments === 1 ? '' : 's'}
                  </span>
                </li>
                {plan.features.slice(0, 3).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectPlan(plan, billingInterval)}
                disabled={isCurrent}
                className={`w-full py-3 font-medium rounded-sm transition-colors ${
                  isCurrent
                    ? 'bg-text/10 text-text/50 cursor-not-allowed'
                    : plan.type === 'professional'
                      ? 'bg-accent text-background hover:bg-accent/90'
                      : 'bg-text text-background hover:bg-text/90'
                }`}
              >
                {isCurrent ? 'Current Plan' : plan.type === 'free' ? 'Get Started' : 'Upgrade'}
              </motion.button>
            </motion.div>
          )
        })}
      </div>

      {/* Enterprise CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-background-alt border border-text/10 rounded-sm p-8 text-center"
      >
        <h3 className="text-xl font-heading font-semibold mb-2">
          Need a custom solution?
        </h3>
        <p className="text-text/70 mb-4">
          Contact us for custom pricing, dedicated support, and enterprise features.
        </p>
        <a
          href="mailto:sales@prow.ai"
          className="inline-block px-6 py-3 border border-text/20 rounded-sm hover:border-text/40 transition-colors"
        >
          Contact Sales
        </a>
      </motion.div>
    </div>
  )
}
