'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Receipt, Crown, Settings } from 'lucide-react'
import BillingOverview from './BillingOverview'
import PlanSelector from './PlanSelector'
import PaymentHistoryTable from './PaymentHistoryTable'
import PaymentMethodList from './PaymentMethodList'
import HostedCheckoutModal from './HostedCheckoutModal'

type Tab = 'overview' | 'plans' | 'history' | 'methods'

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

export default function BillingDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')

  // Check for success/error in URL params
  const success = searchParams.get('success')
  const error = searchParams.get('error')
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchData = useCallback(async () => {
    try {
      const [subResponse, plansResponse] = await Promise.all([
        fetch('/api/payments/subscription'),
        fetch('/api/payments/plans'),
      ])

      if (subResponse.ok) {
        const subData = await subResponse.json()
        setSubscription(subData.subscription)
      }

      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setPlans(plansData.plans || [])
      }
    } catch (err) {
      console.error('Error fetching billing data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session, fetchData])

  const handleSelectPlan = (plan: Plan, interval: 'monthly' | 'yearly') => {
    if (plan.type === 'free') {
      // Select free plan directly
      handleSelectFreePlan(plan)
    } else {
      setSelectedPlan(plan)
      setBillingInterval(interval)
      setCheckoutModalOpen(true)
    }
  }

  const handleSelectFreePlan = async (plan: Plan) => {
    try {
      const response = await fetch('/api/payments/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (err) {
      console.error('Error selecting free plan:', err)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text/60">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Crown className="w-4 h-4" /> },
    { id: 'plans', label: 'Plans', icon: <Settings className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <Receipt className="w-4 h-4" /> },
    { id: 'methods', label: 'Payment Methods', icon: <CreditCard className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-text/10 bg-background-alt">
        <div className="max-w-[var(--container-max-width)] mx-auto px-6 md:px-12 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/app"
                className="text-text/60 hover:text-text transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-heading font-bold">Billing</h1>
                <p className="text-sm text-text/60">
                  Manage your subscription and payment methods
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-4 py-2 text-sm text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Status Messages */}
      {(success || error || canceled) && (
        <div className="max-w-[var(--container-max-width)] mx-auto px-6 md:px-12 pt-6">
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-sm"
            >
              Payment successful! Your subscription has been updated.
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm"
            >
              {decodeURIComponent(error)}
            </motion.div>
          )}
          {canceled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-sm"
            >
              Payment was canceled. You can try again when ready.
            </motion.div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-text/10 bg-background-alt">
        <div className="max-w-[var(--container-max-width)] mx-auto px-6 md:px-12">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent text-text'
                    : 'border-transparent text-text/60 hover:text-text'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[var(--container-max-width)] mx-auto px-6 md:px-12 py-12">
        {activeTab === 'overview' && (
          <BillingOverview
            subscription={subscription}
            onUpgradeClick={() => setActiveTab('plans')}
          />
        )}

        {activeTab === 'plans' && (
          <PlanSelector
            plans={plans}
            currentPlanId={subscription?.planId}
            onSelectPlan={handleSelectPlan}
          />
        )}

        {activeTab === 'history' && <PaymentHistoryTable />}

        {activeTab === 'methods' && <PaymentMethodList />}
      </main>

      {/* Checkout Modal */}
      {selectedPlan && (
        <HostedCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => {
            setCheckoutModalOpen(false)
            setSelectedPlan(null)
          }}
          plan={selectedPlan}
          billingInterval={billingInterval}
        />
      )}
    </div>
  )
}
