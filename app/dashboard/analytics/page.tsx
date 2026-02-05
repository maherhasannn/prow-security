'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { motion } from 'framer-motion'
import {
  DollarSign, Users, TrendingDown, TrendingUp, Download, Calendar
} from 'lucide-react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface HeatmapRow {
  day: string
  [key: `h${number}`]: number
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30)

  const { data, isLoading, error } = useSWR(
    `/api/admin/analytics?period=${period}`,
    fetcher
  )

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/admin/analytics/export?format=${format}`)
      if (!response.ok) throw new Error('Export failed')

      if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`
        a.click()
      }
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch {
      toast.error('Export failed')
    }
  }

  // Process heatmap data
  const heatmapGrid = DAYS.map((day, dayIndex) => ({
    day,
    ...HOURS.reduce((acc, hour) => {
      const found = data?.heatmap?.find(
        (h: any) => h.dayOfWeek === dayIndex && h.hourOfDay === hour
      )
      acc[`h${hour}`] = found?.count || 0
      return acc
    }, {} as Record<string, number>)
  })) as HeatmapRow[]

  const maxHeatValue = Math.max(...(data?.heatmap?.map((h: any) => h.count) || [1]))

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-text">Analytics</h1>
              <p className="text-text/60">Deep insights into usage and costs</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="bg-background border border-text/20 rounded-sm px-3 py-2 text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 border border-text/20 rounded-sm text-sm flex items-center gap-2 hover:bg-text/5"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="px-4 py-2 border border-text/20 rounded-sm text-sm flex items-center gap-2 hover:bg-text/5"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </button>
              </div>
            </div>
          </div>

          {/* Cost Analysis Cards */}
          <div className="grid grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background-alt border border-text/10 rounded-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/10 rounded-sm">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-sm text-text/60">Estimated Cost</span>
              </div>
              <p className="text-3xl font-bold text-text">
                ${data?.costAnalysis?.estimatedCost || '0.00'}
              </p>
              <p className="text-xs text-text/50 mt-1">
                @ ${data?.costAnalysis?.costPer1kTokens}/1k tokens
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-background-alt border border-text/10 rounded-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-sm">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-sm text-text/60">Retention Rate</span>
              </div>
              <p className="text-3xl font-bold text-text">
                {data?.retention?.retentionRate || 0}%
              </p>
              <p className="text-xs text-text/50 mt-1">
                {data?.retention?.activeOldUsers || 0} of {data?.retention?.totalOldUsers || 0} users (30d+)
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background-alt border border-text/10 rounded-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/10 rounded-sm">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-sm text-text/60">Churn Rate</span>
              </div>
              <p className="text-3xl font-bold text-text">
                {data?.retention?.churnRate || 0}%
              </p>
              <p className="text-xs text-text/50 mt-1">Users inactive 7+ days</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-background-alt border border-text/10 rounded-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-sm">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-sm text-text/60">Avg Tokens/User</span>
              </div>
              <p className="text-3xl font-bold text-text">
                {(data?.costAnalysis?.avgTokensPerUser || 0).toLocaleString()}
              </p>
              <p className="text-xs text-text/50 mt-1">
                Max: {(data?.costAnalysis?.maxTokensByUser || 0).toLocaleString()}
              </p>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Cohort Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-background-alt border border-text/10 rounded-sm p-6"
            >
              <h3 className="text-lg font-semibold text-text mb-4">Cohort Analysis</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.cohorts || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="week"
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={12}
                    />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                      }}
                    />
                    <Bar dataKey="signups" name="Sign-ups" fill="#3b82f6" />
                    <Bar dataKey="stillActive" name="Still Active" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Token Usage Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-background-alt border border-text/10 rounded-sm p-6"
            >
              <h3 className="text-lg font-semibold text-text mb-4">Token Usage Trend</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.tokenTrend || []}>
                    <defs>
                      <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={12}
                    />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalTokens"
                      stroke="#8b5cf6"
                      fill="url(#tokenGradient)"
                      name="Tokens"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Login Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-background-alt border border-text/10 rounded-sm p-6"
          >
            <h3 className="text-lg font-semibold text-text mb-4">Login Activity Heatmap</h3>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Hour labels */}
                <div className="flex mb-2 ml-12">
                  {HOURS.filter((_, i) => i % 3 === 0).map(hour => (
                    <div key={hour} className="flex-1 text-xs text-text/50 text-center">
                      {hour}:00
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                {heatmapGrid.map((row, dayIndex) => (
                  <div key={row.day} className="flex items-center mb-1">
                    <div className="w-12 text-xs text-text/60">{row.day}</div>
                    <div className="flex flex-1 gap-0.5">
                      {HOURS.map(hour => {
                        const value = row[`h${hour}`] || 0
                        const intensity = maxHeatValue > 0 ? value / maxHeatValue : 0
                        return (
                          <div
                            key={hour}
                            className="flex-1 h-6 rounded-sm transition-colors"
                            style={{
                              backgroundColor: intensity > 0
                                ? `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`
                                : 'rgba(255,255,255,0.05)'
                            }}
                            title={`${row.day} ${hour}:00 - ${value} logins`}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div className="flex items-center justify-end mt-4 gap-2">
                  <span className="text-xs text-text/50">Less</span>
                  <div className="flex gap-0.5">
                    {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity) => (
                      <div
                        key={intensity}
                        className="w-4 h-4 rounded-sm"
                        style={{ backgroundColor: `rgba(59, 130, 246, ${intensity})` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-text/50">More</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
