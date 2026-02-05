'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

interface Consumer {
  id: string
  email: string
  name: string
  tokensUsed: number
}

interface TopConsumersProps {
  consumers: Consumer[] | undefined
  isLoading: boolean
}

export function TopConsumers({ consumers, isLoading }: TopConsumersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-background-alt border border-text/10 rounded-sm p-6"
    >
      <h3 className="text-lg font-semibold text-text mb-4">Top Token Consumers</h3>
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-text/5 rounded animate-pulse" />
          ))}
        </div>
      ) : consumers && consumers.length > 0 ? (
        <div className="space-y-3">
          {consumers.map((consumer, index) => (
            <div
              key={consumer.id}
              className="flex items-center justify-between p-3 bg-background rounded-sm border border-text/5"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-text/50 w-6">
                  #{index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-text">{consumer.name}</p>
                  <p className="text-xs text-text/50">{consumer.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold text-text">
                  {consumer.tokensUsed.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text/50 text-center py-8">No token usage data yet</p>
      )}
    </motion.div>
  )
}
