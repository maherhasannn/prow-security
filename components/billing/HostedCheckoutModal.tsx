'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, ExternalLink, Shield } from 'lucide-react'

interface Plan {
  id: string
  name: string
  type: string
  description: string | null
  priceMonthly: number
  priceYearly: number
}

interface HostedCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  plan: Plan
  billingInterval: 'monthly' | 'yearly'
}

export default function HostedCheckoutModal({
  isOpen,
  onClose,
  plan,
  billingInterval,
}: HostedCheckoutModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const price = billingInterval === 'monthly' ? plan.priceMonthly : plan.priceYearly

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          billingInterval,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to Elavon hosted payment page
        window.location.href = data.hostedPageUrl
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create checkout session')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-md bg-background border border-text/10 rounded-sm shadow-xl z-50"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-heading font-bold">
                  Upgrade to {plan.name}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 text-text/60 hover:text-text transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Plan Summary */}
              <div className="bg-background-alt border border-text/10 rounded-sm p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{plan.name} Plan</span>
                  <span className="text-xl font-bold">{formatPrice(price)}</span>
                </div>
                <p className="text-sm text-text/60">
                  Billed {billingInterval === 'monthly' ? 'monthly' : 'annually'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm mb-6">
                  {error}
                </div>
              )}

              {/* Security Notice */}
              <div className="flex items-start gap-3 mb-6 p-3 bg-text/5 rounded-sm">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-text/70">
                  <p className="font-medium text-text mb-1">Secure Payment</p>
                  <p>
                    You&apos;ll be redirected to our secure payment provider to complete
                    your purchase. Your card information is never stored on our servers.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 border border-text/20 rounded-sm font-medium hover:bg-text/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 py-3 bg-text text-background rounded-sm font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
