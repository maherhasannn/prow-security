'use client'

import { Users, Zap, Activity, UserCheck, LogIn, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'

interface Stats {
  totalUsers: number
  newUsersLast7Days: number
  totalTokensUsed: number
  totalAiMessages: number
  activeUsersLast24h: number
  totalLogins: number
}

interface StatsOverviewProps {
  stats: Stats | undefined
  isLoading: boolean
}

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'New Users (7 days)',
      value: stats?.newUsersLast7Days ?? 0,
      icon: UserCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Active (24h)',
      value: stats?.activeUsersLast24h ?? 0,
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Total Tokens Used',
      value: stats?.totalTokensUsed?.toLocaleString() ?? 0,
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Total Logins',
      value: stats?.totalLogins?.toLocaleString() ?? 0,
      icon: LogIn,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      label: 'AI Messages',
      value: stats?.totalAiMessages?.toLocaleString() ?? 0,
      icon: MessageSquare,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-background-alt border border-text/10 rounded-sm p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-sm ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-text/10 rounded animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-bold text-text">{stat.value}</p>
              <p className="text-xs text-text/60 mt-1">{stat.label}</p>
            </>
          )}
        </motion.div>
      ))}
    </div>
  )
}
