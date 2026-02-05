'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Key, Server, Database, Users } from 'lucide-react'
import { toast } from 'sonner'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default function SecurityPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-sm">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-text">Security Center</h1>
            </div>
            <p className="text-text/60">
              Advanced security controls and system configurations
            </p>
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
                    <h2 className="text-lg font-semibold text-text">Security Authentication Required</h2>
                    <p className="text-sm text-text/60 mt-2">
                      Enter your security credentials to access this area
                    </p>
                  </div>

                  <form onSubmit={handleAuthenticate} className="space-y-4">
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Security Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="off"
                        className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Enter username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Security Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="off"
                          className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-12"
                          placeholder="Enter password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-text/60"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      className="w-full px-6 py-3 bg-amber-500 text-background font-medium rounded-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Verifying...' : 'Authenticate'}
                    </motion.button>
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
                {/* Success Banner */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-sm p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <p className="text-sm text-green-400">Security access granted. Handle with extreme care.</p>
                </div>

                {/* Security Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Encryption Keys */}
                  <div className="bg-background-alt border border-text/10 rounded-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-500/10 rounded-sm">
                        <Key className="w-5 h-5 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-text">Encryption Keys</h3>
                    </div>
                    <p className="text-sm text-text/60 mb-4">
                      Manage document encryption keys and rotation schedules
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text/60">Active Keys</span>
                        <span className="text-text font-medium">3</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text/60">Last Rotation</span>
                        <span className="text-text font-medium">14 days ago</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text/60">Algorithm</span>
                        <span className="text-text font-medium">AES-256-GCM</span>
                      </div>
                    </div>
                    <button className="mt-4 w-full px-4 py-2 border border-text/20 text-text/70 text-sm font-medium rounded-sm hover:bg-text/5 transition-colors">
                      Rotate Keys
                    </button>
                  </div>

                  {/* Server Status */}
                  <div className="bg-background-alt border border-text/10 rounded-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-500/10 rounded-sm">
                        <Server className="w-5 h-5 text-green-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-text">Server Status</h3>
                    </div>
                    <p className="text-sm text-text/60 mb-4">
                      Infrastructure health and security status
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text/60">API Server</span>
                        <span className="text-green-400 font-medium">Healthy</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text/60">Database</span>
                        <span className="text-green-400 font-medium">Connected</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text/60">SSL Certificate</span>
                        <span className="text-text font-medium">Valid (89 days)</span>
                      </div>
                    </div>
                    <button className="mt-4 w-full px-4 py-2 border border-text/20 text-text/70 text-sm font-medium rounded-sm hover:bg-text/5 transition-colors">
                      View Details
                    </button>
                  </div>

                  {/* Database Security */}
                  <div className="bg-background-alt border border-text/10 rounded-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-500/10 rounded-sm">
                        <Database className="w-5 h-5 text-purple-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-text">Database Security</h3>
                    </div>
                    <p className="text-sm text-text/60 mb-4">
                      Database access controls and backup status
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text/60">Last Backup</span>
                        <span className="text-text font-medium">2 hours ago</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text/60">Encryption</span>
                        <span className="text-green-400 font-medium">Enabled</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text/60">Connection Pool</span>
                        <span className="text-text font-medium">12/50</span>
                      </div>
                    </div>
                    <button className="mt-4 w-full px-4 py-2 border border-text/20 text-text/70 text-sm font-medium rounded-sm hover:bg-text/5 transition-colors">
                      Manage Backups
                    </button>
                  </div>

                  {/* Access Control */}
                  <div className="bg-background-alt border border-text/10 rounded-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-500/10 rounded-sm">
                        <Users className="w-5 h-5 text-amber-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-text">Access Control</h3>
                    </div>
                    <p className="text-sm text-text/60 mb-4">
                      User permissions and authentication settings
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text/60">Admin Users</span>
                        <span className="text-text font-medium">2</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text/60">2FA Enabled</span>
                        <span className="text-amber-400 font-medium">Optional</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text/60">Session Timeout</span>
                        <span className="text-text font-medium">30 days</span>
                      </div>
                    </div>
                    <button className="mt-4 w-full px-4 py-2 border border-text/20 text-text/70 text-sm font-medium rounded-sm hover:bg-text/5 transition-colors">
                      Configure
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-sm p-6">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
                  <p className="text-sm text-text/60 mb-4">
                    These actions are irreversible. Proceed with extreme caution.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 border border-red-500/30 text-red-400 text-sm font-medium rounded-sm hover:bg-red-500/10 transition-colors">
                      Purge All Sessions
                    </button>
                    <button className="px-4 py-2 border border-red-500/30 text-red-400 text-sm font-medium rounded-sm hover:bg-red-500/10 transition-colors">
                      Reset All API Keys
                    </button>
                    <button className="px-4 py-2 border border-red-500/30 text-red-400 text-sm font-medium rounded-sm hover:bg-red-500/10 transition-colors">
                      Emergency Lockdown
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
