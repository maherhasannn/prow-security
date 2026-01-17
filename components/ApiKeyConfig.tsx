'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, X, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ApiKeyConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (apiKey: string) => void
  currentApiKey?: string
}

export default function ApiKeyConfig({
  isOpen,
  onClose,
  onSave,
  currentApiKey,
}: ApiKeyConfigProps) {
  const [apiKey, setApiKey] = useState(currentApiKey || '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const handleSave = () => {
    setError(null)

    if (!apiKey.trim()) {
      setError('API key is required')
      return
    }

    // Basic validation - API keys should be at least 20 characters
    if (apiKey.length < 20) {
      setError('Invalid API key format')
      return
    }

    try {
      onSave(apiKey.trim())
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key')
    }
  }

  const handleClear = () => {
    setApiKey('')
    setError(null)
    setSuccess(false)
    onSave('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-text/10 rounded-sm shadow-2xl w-full max-w-[500px] pointer-events-auto my-auto"
            >
              <div className="p-6 border-b border-text/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Key className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-xl font-heading font-bold">
                        Configure API Key
                      </h2>
                      <p className="text-sm text-text/60 mt-1">
                        Enter your API key
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-background-alt rounded-sm transition-colors"
                  >
                    <X className="w-5 h-5 text-text/60" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-3" />
                    <p className="text-text font-medium">API key saved successfully</p>
                  </motion.div>
                ) : (
                  <>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2"
                      >
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-700">{error}</div>
                      </motion.div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="api-key"
                          className="block text-sm font-medium text-text mb-2"
                        >
                          API Key
                        </label>
                        <div className="relative">
                          <input
                            id="api-key"
                            type={showKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => {
                              setApiKey(e.target.value)
                              setError(null)
                            }}
                            placeholder="Enter your API key"
                            className="w-full px-4 py-3 bg-background-alt border border-text/20 rounded-sm text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-text transition-colors"
                          >
                            {showKey ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <p className="text-xs text-text/50 mt-1.5">
                          API key configuration
                        </p>
                      </div>

                      <div className="p-3 bg-background-alt border border-text/10 rounded-sm">
                        <p className="text-xs text-text/70">
                          <strong>Note:</strong> API key configuration
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-text/10">
                      {currentApiKey && (
                        <button
                          type="button"
                          onClick={handleClear}
                          className="px-4 py-2 text-sm font-medium text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors"
                      >
                        Cancel
                      </button>
                      <motion.button
                        type="button"
                        onClick={handleSave}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-2 text-sm font-medium bg-text text-background rounded-sm hover:bg-accent transition-colors"
                      >
                        Save
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

