'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Settings, Wrench, Key, Palette, Save, AlertTriangle, Check,
  Eye, EyeOff, RefreshCw
} from 'lucide-react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

interface SettingValue {
  value: string | null
  description: string | null
  updatedAt: Date | null
}

export default function SettingsPage() {
  const { data, isLoading, mutate } = useSWR('/api/admin/settings', fetcher)
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})

  // Initialize local settings from fetched data
  useEffect(() => {
    if (data?.settings) {
      const initial: Record<string, string> = {}
      for (const [key, val] of Object.entries(data.settings)) {
        initial[key] = (val as SettingValue).value || ''
      }
      setLocalSettings(initial)
    }
  }, [data])

  const handleSave = async (key: string) => {
    setSaving(key)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: localSettings[key] }),
      })

      if (response.ok) {
        toast.success(`${key} saved`)
        mutate()
      } else {
        const result = await response.json()
        toast.error(result.error)
      }
    } catch {
      toast.error('Failed to save setting')
    } finally {
      setSaving(null)
    }
  }

  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const SettingInput = ({
    settingKey,
    label,
    description,
    type = 'text',
    isSecret = false
  }: {
    settingKey: string
    label: string
    description: string
    type?: 'text' | 'toggle' | 'number'
    isSecret?: boolean
  }) => {
    const value = localSettings[settingKey] ?? ''
    const hasChanged = data?.settings?.[settingKey]?.value !== value

    return (
      <div className="flex items-start justify-between py-4 border-b border-text/5 last:border-0">
        <div className="flex-1">
          <label className="block text-sm font-medium text-text">{label}</label>
          <p className="text-xs text-text/50 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {type === 'toggle' ? (
            <button
              onClick={() => {
                setLocalSettings(prev => ({
                  ...prev,
                  [settingKey]: prev[settingKey] === 'true' ? 'false' : 'true'
                }))
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                value === 'true' ? 'bg-accent' : 'bg-text/20'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-transform ${
                  value === 'true' ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          ) : (
            <div className="relative">
              <input
                type={isSecret && !showApiKeys[settingKey] ? 'password' : type === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, [settingKey]: e.target.value }))}
                className="w-64 px-3 py-2 bg-background border border-text/20 rounded-sm text-sm pr-10"
              />
              {isSecret && (
                <button
                  type="button"
                  onClick={() => toggleApiKeyVisibility(settingKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40"
                >
                  {showApiKeys[settingKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          )}
          {hasChanged && (
            <button
              onClick={() => handleSave(settingKey)}
              disabled={saving === settingKey}
              className="px-3 py-2 bg-accent text-background text-sm font-medium rounded-sm flex items-center gap-1 disabled:opacity-50"
            >
              {saving === settingKey ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-text/10 rounded-sm">
                <Settings className="w-6 h-6 text-text" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-text">Settings</h1>
            </div>
            <p className="text-text/60">Configure application settings and integrations</p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-text/5 rounded-sm animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* App Configuration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background-alt border border-text/10 rounded-sm"
              >
                <div className="p-4 border-b border-text/10">
                  <div className="flex items-center gap-3">
                    <Wrench className="w-5 h-5 text-text/60" />
                    <div>
                      <h3 className="font-semibold text-text">App Configuration</h3>
                      <p className="text-sm text-text/60">Global application settings</p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <SettingInput
                    settingKey="maintenance_mode"
                    label="Maintenance Mode"
                    description="Enable to show maintenance page to all users"
                    type="toggle"
                  />
                  <SettingInput
                    settingKey="max_tokens_per_user"
                    label="Default Max Tokens Per User"
                    description="Maximum tokens a user can consume (0 = unlimited)"
                    type="number"
                  />
                </div>
              </motion.div>

              {/* API Integrations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-background-alt border border-text/10 rounded-sm"
              >
                <div className="p-4 border-b border-text/10">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-text/60" />
                    <div>
                      <h3 className="font-semibold text-text">API Integrations</h3>
                      <p className="text-sm text-text/60">Third-party service configuration</p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-sm p-3 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <p className="text-sm text-amber-400">
                      API keys are stored in environment variables. Changes here are for reference only.
                      Update keys in your deployment settings (Vercel, etc.)
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="py-4 border-b border-text/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-text">OpenAI API Key</label>
                          <p className="text-xs text-text/50 mt-1">Used for AI chat and document processing</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            process.env.NEXT_PUBLIC_OPENAI_CONFIGURED === 'true'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-text/10 text-text/50'
                          }`}>
                            {process.env.NEXT_PUBLIC_OPENAI_CONFIGURED === 'true' ? 'Configured' : 'Not Set'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="py-4 border-b border-text/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-text">Anthropic API Key</label>
                          <p className="text-xs text-text/50 mt-1">Used for Claude AI interactions</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            process.env.NEXT_PUBLIC_ANTHROPIC_CONFIGURED === 'true'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-text/10 text-text/50'
                          }`}>
                            {process.env.NEXT_PUBLIC_ANTHROPIC_CONFIGURED === 'true' ? 'Configured' : 'Not Set'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="py-4 border-b border-text/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-text">Elavon Payment Gateway</label>
                          <p className="text-xs text-text/50 mt-1">Used for payment processing</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs rounded bg-green-500/10 text-green-400">
                            Configured
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-text">Resend Email Service</label>
                          <p className="text-xs text-text/50 mt-1">Used for transactional emails</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs rounded bg-text/10 text-text/50">
                            Not Set
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Branding */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-background-alt border border-text/10 rounded-sm"
              >
                <div className="p-4 border-b border-text/10">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-text/60" />
                    <div>
                      <h3 className="font-semibold text-text">Branding</h3>
                      <p className="text-sm text-text/60">Customize dashboard appearance</p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <SettingInput
                    settingKey="app_name"
                    label="Application Name"
                    description="Displayed in the header and browser tab"
                  />
                  <SettingInput
                    settingKey="support_email"
                    label="Support Email"
                    description="Contact email shown to users"
                  />
                  <SettingInput
                    settingKey="logo_url"
                    label="Logo URL"
                    description="URL to custom logo image (leave empty for default)"
                  />
                </div>
              </motion.div>

              {/* Danger Zone */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-red-500/5 border border-red-500/20 rounded-sm p-6"
              >
                <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
                <p className="text-sm text-text/60 mb-4">
                  Destructive actions that cannot be undone. Use with extreme caution.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => toast.error('This would clear all user sessions')}
                    className="px-4 py-2 border border-red-500/30 text-red-400 text-sm font-medium rounded-sm hover:bg-red-500/10"
                  >
                    Clear All Sessions
                  </button>
                  <button
                    onClick={() => toast.error('This would purge all audit logs')}
                    className="px-4 py-2 border border-red-500/30 text-red-400 text-sm font-medium rounded-sm hover:bg-red-500/10"
                  >
                    Purge Audit Logs
                  </button>
                  <button
                    onClick={() => toast.error('This would reset all token counters')}
                    className="px-4 py-2 border border-red-500/30 text-red-400 text-sm font-medium rounded-sm hover:bg-red-500/10"
                  >
                    Reset All Token Usage
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
