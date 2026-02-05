'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Receipt, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  description: string | null
  elavonTransactionId: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PaymentHistoryTable() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/payments/history?page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 })
      }
    } catch (err) {
      console.error('Error fetching payments:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments(1)
  }, [fetchPayments])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAmount = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(cents / 100)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-amber-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'refunded':
      case 'partially_refunded':
        return <RotateCcw className="w-4 h-4 text-blue-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-text/60" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'processing':
        return 'bg-amber-100 text-amber-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
      case 'partially_refunded':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text/60">Loading payment history...</div>
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background-alt border border-text/10 rounded-sm p-12 text-center"
      >
        <Receipt className="w-12 h-12 mx-auto mb-4 text-text/40" />
        <h3 className="text-xl font-heading font-semibold mb-2">No Payments Yet</h3>
        <p className="text-text/70">
          Your payment history will appear here after your first transaction.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background-alt border border-text/10 rounded-sm overflow-hidden"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-text/10">
              <th className="text-left px-6 py-4 text-sm font-medium text-text/70">
                Date
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-text/70">
                Description
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-text/70">
                Amount
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-text/70">
                Status
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-text/70">
                Transaction ID
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-text/5 hover:bg-text/5 transition-colors"
              >
                <td className="px-6 py-4 text-sm">
                  {formatDate(payment.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {payment.description || 'Subscription payment'}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {formatAmount(payment.amount, payment.currency)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-sm ${getStatusColor(payment.status)}`}
                  >
                    {getStatusIcon(payment.status)}
                    {payment.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-text/60 font-mono">
                  {payment.elavonTransactionId || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text/60">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} payments
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPayments(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-text/20 rounded-sm hover:bg-text/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchPayments(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 border border-text/20 rounded-sm hover:bg-text/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
