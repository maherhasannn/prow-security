'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Shield, FileLock, Eye, X, CheckCircle2, AlertCircle } from 'lucide-react'

interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface SecurityFeature {
  icon: React.ReactNode
  label: string
  description: string
}

const securityFeatures: SecurityFeature[] = [
  {
    icon: <Lock className="w-5 h-5" />,
    label: 'End-to-End Encryption',
    description: 'AES-256 encryption at rest',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    label: 'Organization-Isolated',
    description: 'Complete data isolation',
  },
  {
    icon: <FileLock className="w-5 h-5" />,
    label: 'No Data Training',
    description: 'Your data never trains AI models',
  },
  {
    icon: <Eye className="w-5 h-5" />,
    label: 'Full Audit Trail',
    description: 'Every action logged and traceable',
  },
]

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Workspace name is required')
      return
    }

    if (name.length > 255) {
      setError('Workspace name must be 255 characters or less')
      return
    }

    if (description && description.length > 1000) {
      setError('Description must be 1000 characters or less')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create workspace')
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setName('')
        setDescription('')
        setError(null)
        onSuccess()
        onClose()
        // Navigate to workspace chat
        if (data.workspace?.id) {
          window.location.href = `/app/workspaces/${data.workspace.id}`
        }
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName('')
      setDescription('')
      setError(null)
      setSuccess(false)
      onClose()
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-text/10 rounded-sm shadow-2xl w-full max-w-[600px] pointer-events-auto my-auto max-h-[90vh] flex flex-col"
            >
              {/* Header with Security Badge */}
              <div className="border-b border-text/10 bg-background-alt p-6 flex-shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center"
                    >
                      <Lock className="w-5 h-5 text-accent" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-heading font-bold">
                        Create Secure Workspace
                      </h2>
                      <p className="text-sm text-text/60 mt-1">
                        Medical-grade security foundation
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="p-2 hover:bg-background rounded-sm transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-text/60" />
                  </button>
                </div>

                {/* Security Status Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/5 border border-accent/20 rounded-sm w-fit">
                  <Shield className="w-4 h-4 text-accent" />
                  <span className="text-xs font-heading font-semibold text-accent uppercase tracking-wider">
                    Secure by Default
                  </span>
                </div>
              </div>

              {/* Security Features */}
              <div className="p-6 border-b border-text/10 bg-accent/5 flex-shrink-0">
                <h3 className="text-sm font-heading font-semibold text-text/70 uppercase tracking-wider mb-4">
                  Security Guarantees
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {securityFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-background rounded-sm border border-text/5"
                    >
                      <div className="text-accent mt-0.5 flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text">
                          {feature.label}
                        </div>
                        <div className="text-xs text-text/60 mt-0.5">
                          {feature.description}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle2 className="w-8 h-8 text-accent" />
                    </motion.div>
                    <h3 className="text-xl font-heading font-bold mb-2">
                      Workspace Created Securely
                    </h3>
                    <p className="text-text/70 mb-2">
                      Your workspace is protected with end-to-end encryption
                    </p>
                    <p className="text-sm text-text/60">
                      All actions have been logged to the audit trail
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-50 border border-red-200 rounded-sm flex items-start gap-3"
                      >
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-red-900">
                            Security Validation Error
                          </div>
                          <div className="text-sm text-red-700 mt-1">{error}</div>
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-6">
                      <div>
                        <label
                          htmlFor="workspace-name"
                          className="block text-sm font-medium text-text mb-2"
                        >
                          Workspace Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="workspace-name"
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value)
                            setError(null)
                          }}
                          placeholder="e.g., Q4 Financial Analysis"
                          maxLength={255}
                          required
                          disabled={loading}
                          className="w-full px-4 py-3 bg-background-alt border border-text/20 rounded-sm text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <p className="text-xs text-text/50 mt-1.5">
                          Choose a name that reflects the sensitive nature of this workspace
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="workspace-description"
                          className="block text-sm font-medium text-text mb-2"
                        >
                          Description <span className="text-text/40">(Optional)</span>
                        </label>
                        <textarea
                          id="workspace-description"
                          value={description}
                          onChange={(e) => {
                            setDescription(e.target.value)
                            setError(null)
                          }}
                          placeholder="Describe the purpose of this secure workspace..."
                          maxLength={1000}
                          rows={3}
                          disabled={loading}
                          className="w-full px-4 py-3 bg-background-alt border border-text/20 rounded-sm text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <p className="text-xs text-text/50 mt-1.5">
                          {description.length}/1000 characters
                        </p>
                      </div>

                      {/* Security Notice */}
                      <div className="p-4 bg-background-alt border border-accent/20 rounded-sm">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-text mb-1">
                              Security Notice
                            </div>
                            <p className="text-xs text-text/70 leading-relaxed">
                              This workspace will be created with full security enabled. All
                              documents, AI interactions, and access will be encrypted,
                              isolated, and logged. Your data will never be used to train AI
                              models.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-text/10">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <motion.button
                        type="submit"
                        disabled={loading || !name.trim()}
                        whileHover={!loading && name.trim() ? { scale: 1.02 } : {}}
                        whileTap={!loading && name.trim() ? { scale: 0.98 } : {}}
                        className="px-6 py-2 text-sm font-medium bg-text text-background rounded-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-background border-t-transparent rounded-full"
                            />
                            Creating Securely...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Create Secure Workspace
                          </>
                        )}
                      </motion.button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

