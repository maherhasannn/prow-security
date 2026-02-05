'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, FileText,
  Flag, Globe, Plus, Trash2, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

export default function SecurityPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState<'audit' | 'flags' | 'whitelist'>('audit')
  const [auditPage, setAuditPage] = useState(1)
  const [showAddIp, setShowAddIp] = useState(false)
  const [newIp, setNewIp] = useState('')
  const [newIpDesc, setNewIpDesc] = useState('')

  const { data: auditData, mutate: mutateAudit } = useSWR(
    isAuthenticated ? `/api/admin/security/audit?page=${auditPage}&limit=20` : null,
    fetcher
  )

  const { data: flagsData, mutate: mutateFlags } = useSWR(
    isAuthenticated ? '/api/admin/security/flags' : null,
    fetcher
  )

  const { data: whitelistData, mutate: mutateWhitelist } = useSWR(
    isAuthenticated ? '/api/admin/security/whitelist' : null,
    fetcher
  )

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/security/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        toast.success('Security access granted')
      } else {
        const data = await response.json()
        setError(data.error || 'Authentication failed')
      }
    } catch {
      setError('Failed to verify credentials')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolveFlag = async (flagId: string, isResolved: boolean) => {
    try {
      const response = await fetch('/api/admin/security/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagId, isResolved }),
      })

      if (response.ok) {
        toast.success(isResolved ? 'Flag resolved' : 'Flag reopened')
        mutateFlags()
      }
    } catch {
      toast.error('Failed to update flag')
    }
  }

  const handleAddIp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/security/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress: newIp, description: newIpDesc }),
      })

      if (response.ok) {
        toast.success('IP added to whitelist')
        setNewIp('')
        setNewIpDesc('')
        setShowAddIp(false)
        mutateWhitelist()
      } else {
        const data = await response.json()
        toast.error(data.error)
      }
    } catch {
      toast.error('Failed to add IP')
    }
  }

  const handleRemoveIp = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/security/whitelist?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('IP removed from whitelist')
        mutateWhitelist()
      }
    } catch {
      toast.error('Failed to remove IP')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-sm">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-text">Security Center</h1>
            </div>
            <p className="text-text/60">Audit logs, flagged users, and access controls</p>
          </div>

          <AnimatePresence mode="wait">
            {!isAuthenticated ? (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-md mx-auto"
              >
                <div className="bg-background-alt border border-text/10 rounded-sm p-8">
                  <div className="text-center mb-6">
                    <div className="inline-flex p-3 bg-amber-500/10 rounded-full mb-4">
                      <Lock className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-text">Security Authentication</h2>
                    <p className="text-sm text-text/60 mt-2">Enter credentials to access security controls</p>
                  </div>

                  <form onSubmit={handleAuthenticate} className="space-y-4">
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="off"
                        className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="off"
                          className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full px-6 py-3 bg-amber-500 text-background font-medium rounded-sm hover:bg-amber-600 disabled:opacity-50"
                    >
                      {isLoading ? 'Verifying...' : 'Authenticate'}
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Tabs */}
                <div className="flex gap-2 border-b border-text/10">
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'audit' ? 'border-accent text-accent' : 'border-transparent text-text/60 hover:text-text'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Audit Logs
                  </button>
                  <button
                    onClick={() => setActiveTab('flags')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'flags' ? 'border-accent text-accent' : 'border-transparent text-text/60 hover:text-text'
                    }`}
                  >
                    <Flag className="w-4 h-4 inline mr-2" />
                    Flagged Users
                    {flagsData?.flags?.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                        {flagsData.flags.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('whitelist')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'whitelist' ? 'border-accent text-accent' : 'border-transparent text-text/60 hover:text-text'
                    }`}
                  >
                    <Globe className="w-4 h-4 inline mr-2" />
                    IP Whitelist
                  </button>
                </div>

                {/* Audit Logs Tab */}
                {activeTab === 'audit' && (
                  <div className="bg-background-alt border border-text/10 rounded-sm">
                    <div className="p-4 border-b border-text/10">
                      <h3 className="font-semibold text-text">Admin Action Log</h3>
                      <p className="text-sm text-text/60">Read-only ledger of all administrative actions</p>
                    </div>

                    <div className="divide-y divide-text/5">
                      {auditData?.logs?.map((log: any) => (
                        <div key={log.id} className="p-4 hover:bg-text/5">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-text">
                                {log.userName || 'System'} - <span className="text-accent">{log.action}</span>
                              </p>
                              <p className="text-xs text-text/50 mt-1">
                                {log.resourceType} {log.resourceId && `(${log.resourceId.slice(0, 8)}...)`}
                              </p>
                              {log.ipAddress && (
                                <p className="text-xs text-text/40 mt-1">IP: {log.ipAddress}</p>
                              )}
                            </div>
                            <span className="text-xs text-text/50">{formatDate(log.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {auditData?.pagination && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-text/10">
                        <p className="text-sm text-text/60">
                          Page {auditData.pagination.page} of {auditData.pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                            disabled={auditPage === 1}
                            className="p-2 border border-text/20 rounded-sm disabled:opacity-30"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAuditPage(p => p + 1)}
                            disabled={auditPage >= auditData.pagination.totalPages}
                            className="p-2 border border-text/20 rounded-sm disabled:opacity-30"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Flags Tab */}
                {activeTab === 'flags' && (
                  <div className="space-y-4">
                    {/* Severity Summary */}
                    <div className="grid grid-cols-4 gap-4">
                      {['critical', 'high', 'medium', 'low'].map(severity => {
                        const count = flagsData?.severityCounts?.find((s: any) => s.severity === severity)?.count || 0
                        const colors: Record<string, string> = {
                          critical: 'bg-red-500/10 text-red-400 border-red-500/20',
                          high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                          medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                          low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                        }
                        return (
                          <div key={severity} className={`border rounded-sm p-4 ${colors[severity]}`}>
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-sm capitalize">{severity}</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Flags List */}
                    <div className="bg-background-alt border border-text/10 rounded-sm">
                      <div className="p-4 border-b border-text/10">
                        <h3 className="font-semibold text-text">Flagged Users</h3>
                        <p className="text-sm text-text/60">Users with suspicious activity</p>
                      </div>

                      {flagsData?.flags?.length > 0 ? (
                        <div className="divide-y divide-text/5">
                          {flagsData.flags.map((flag: any) => (
                            <div key={flag.id} className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-sm ${
                                    flag.severity === 'critical' ? 'bg-red-500/10' :
                                    flag.severity === 'high' ? 'bg-orange-500/10' :
                                    'bg-yellow-500/10'
                                  }`}>
                                    <AlertTriangle className={`w-4 h-4 ${
                                      flag.severity === 'critical' ? 'text-red-500' :
                                      flag.severity === 'high' ? 'text-orange-500' :
                                      'text-yellow-500'
                                    }`} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-text">{flag.userName}</p>
                                    <p className="text-sm text-text/60">{flag.userEmail}</p>
                                    <p className="text-sm text-text/80 mt-1">{flag.flagType}</p>
                                    {flag.description && (
                                      <p className="text-xs text-text/50 mt-1">{flag.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-text/50">{formatDate(flag.createdAt)}</span>
                                  <button
                                    onClick={() => handleResolveFlag(flag.id, !flag.isResolved)}
                                    className={`px-3 py-1 text-xs font-medium rounded-sm ${
                                      flag.isResolved
                                        ? 'bg-text/10 text-text/60'
                                        : 'bg-green-500/10 text-green-400'
                                    }`}
                                  >
                                    {flag.isResolved ? 'Reopen' : 'Resolve'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                          <p className="text-text/60">No flagged users</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Whitelist Tab */}
                {activeTab === 'whitelist' && (
                  <div className="bg-background-alt border border-text/10 rounded-sm">
                    <div className="p-4 border-b border-text/10 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-text">IP Whitelist</h3>
                        <p className="text-sm text-text/60">Restrict dashboard access to specific IPs</p>
                      </div>
                      <button
                        onClick={() => setShowAddIp(true)}
                        className="px-4 py-2 bg-accent text-background text-sm font-medium rounded-sm flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add IP
                      </button>
                    </div>

                    {/* Add IP Form */}
                    {showAddIp && (
                      <div className="p-4 border-b border-text/10 bg-text/5">
                        <form onSubmit={handleAddIp} className="flex gap-4">
                          <input
                            type="text"
                            value={newIp}
                            onChange={(e) => setNewIp(e.target.value)}
                            placeholder="IP Address (e.g., 192.168.1.1)"
                            required
                            className="flex-1 px-4 py-2 bg-background border border-text/20 rounded-sm text-sm"
                          />
                          <input
                            type="text"
                            value={newIpDesc}
                            onChange={(e) => setNewIpDesc(e.target.value)}
                            placeholder="Description (optional)"
                            className="flex-1 px-4 py-2 bg-background border border-text/20 rounded-sm text-sm"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-green-500 text-background text-sm font-medium rounded-sm"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddIp(false)}
                            className="px-4 py-2 border border-text/20 text-sm rounded-sm"
                          >
                            Cancel
                          </button>
                        </form>
                      </div>
                    )}

                    {whitelistData?.ips?.length > 0 ? (
                      <div className="divide-y divide-text/5">
                        {whitelistData.ips.map((ip: any) => (
                          <div key={ip.id} className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-mono text-text">{ip.ipAddress}</p>
                              {ip.description && (
                                <p className="text-sm text-text/60">{ip.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`px-2 py-1 text-xs rounded ${
                                ip.isActive ? 'bg-green-500/10 text-green-400' : 'bg-text/10 text-text/50'
                              }`}>
                                {ip.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <button
                                onClick={() => handleRemoveIp(ip.id)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Globe className="w-12 h-12 text-text/20 mx-auto mb-4" />
                        <p className="text-text/60">No IPs whitelisted</p>
                        <p className="text-sm text-text/40">All IPs can access the dashboard</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
