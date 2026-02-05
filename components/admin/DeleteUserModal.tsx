'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
}

interface DeleteUserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (userId: string) => Promise<void>
}

export function DeleteUserModal({ user, isOpen, onClose, onConfirm }: DeleteUserModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleDelete = async () => {
    if (!user || confirmText !== user.email) return

    setIsDeleting(true)
    try {
      await onConfirm(user.id)
      onClose()
    } finally {
      setIsDeleting(false)
      setConfirmText('')
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('')
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background-alt border border-text/10 rounded-sm p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-sm">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-text">Delete User</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="p-2 hover:bg-text/5 rounded-sm transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-text/60" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-text/70">
                You are about to permanently delete the user account for:
              </p>

              <div className="bg-background border border-text/10 rounded-sm p-3">
                <p className="font-medium text-text">{user.name}</p>
                <p className="text-sm text-text/60">{user.email}</p>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-3">
                <p className="text-sm text-red-400">
                  This action is irreversible. All user data, including their organizations
                  (if sole owner), workspaces, documents, and AI sessions will be permanently deleted.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Type <span className="font-mono text-accent">{user.email}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isDeleting}
                  className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50"
                  placeholder={user.email}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 border border-text/20 text-text font-medium rounded-sm hover:bg-text/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || confirmText !== user.email}
                  className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete User'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
