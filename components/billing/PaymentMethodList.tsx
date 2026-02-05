'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Trash2, Star, AlertCircle } from 'lucide-react'

interface PaymentMethod {
  id: string
  type: string
  cardLast4: string | null
  cardBrand: string | null
  expMonth: number | null
  expYear: number | null
  isDefault: boolean
  createdAt: string
}

export default function PaymentMethodList() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchMethods = useCallback(async () => {
    try {
      const response = await fetch('/api/payments/methods')
      if (response.ok) {
        const data = await response.json()
        setMethods(data.methods || [])
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMethods()
  }, [fetchMethods])

  const handleSetDefault = async (methodId: string) => {
    try {
      const response = await fetch(`/api/payments/methods/${methodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (response.ok) {
        fetchMethods()
      }
    } catch (err) {
      console.error('Error setting default method:', err)
    }
  }

  const handleDelete = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return
    }

    setDeleting(methodId)
    try {
      const response = await fetch(`/api/payments/methods/${methodId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchMethods()
      }
    } catch (err) {
      console.error('Error deleting method:', err)
    } finally {
      setDeleting(null)
    }
  }

  const getCardIcon = (brand: string | null) => {
    // Could use brand-specific icons here
    return <CreditCard className="w-8 h-8 text-text/60" />
  }

  const formatExpiry = (month: number | null, year: number | null) => {
    if (!month || !year) return 'N/A'
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text/60">Loading payment methods...</div>
      </div>
    )
  }

  if (methods.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background-alt border border-text/10 rounded-sm p-12 text-center"
      >
        <CreditCard className="w-12 h-12 mx-auto mb-4 text-text/40" />
        <h3 className="text-xl font-heading font-semibold mb-2">
          No Payment Methods
        </h3>
        <p className="text-text/70 mb-6">
          Payment methods are automatically saved when you complete a purchase.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-text/60">
          <AlertCircle className="w-4 h-4" />
          <span>Your card information is securely stored with our payment provider.</span>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {methods.map((method, index) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-background-alt border rounded-sm p-6 flex items-center justify-between ${
              method.isDefault ? 'border-accent' : 'border-text/10'
            }`}
          >
            <div className="flex items-center gap-4">
              {getCardIcon(method.cardBrand)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize">
                    {method.cardBrand || 'Card'}
                  </span>
                  <span className="text-text/60">ending in</span>
                  <span className="font-mono font-medium">
                    {method.cardLast4 || '****'}
                  </span>
                  {method.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-sm">
                      <Star className="w-3 h-3" />
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-text/60">
                  Expires {formatExpiry(method.expMonth, method.expYear)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!method.isDefault && (
                <button
                  onClick={() => handleSetDefault(method.id)}
                  className="px-3 py-1.5 text-sm border border-text/20 rounded-sm hover:bg-text/5 transition-colors"
                >
                  Set Default
                </button>
              )}
              <button
                onClick={() => handleDelete(method.id)}
                disabled={deleting === method.id}
                className="p-2 text-red-600 hover:bg-red-50 rounded-sm transition-colors disabled:opacity-50"
              >
                {deleting === method.id ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="mt-6 p-4 bg-text/5 rounded-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-text/60 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-text/70">
            <p className="font-medium mb-1">About Payment Security</p>
            <p>
              Your card information is securely stored with our PCI-compliant payment
              provider. We never store your full card number on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
