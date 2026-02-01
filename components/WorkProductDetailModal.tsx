'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, FileText, Trash2, Save, Copy, Check, Download,
  Loader2, FileEdit, Briefcase, Mail, BarChart3, MessageSquare, Scale
} from 'lucide-react'

interface WorkProduct {
  id: string
  title: string
  type: string
  content: string
  noteId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  createdByName?: string
}

interface WorkProductDetailModalProps {
  isOpen: boolean
  onClose: () => void
  workProduct: WorkProduct | null
  workspaceId: string
  onWorkProductUpdated: (workProduct: WorkProduct) => void
  onWorkProductDeleted: (productId: string) => void
}

const formatTimestamp = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const typeIcons: Record<string, React.ReactNode> = {
  'article': <FileEdit className="w-5 h-5" />,
  'brief': <Briefcase className="w-5 h-5" />,
  'memo': <Mail className="w-5 h-5" />,
  'executive-summary': <BarChart3 className="w-5 h-5" />,
  'messaging-framework': <MessageSquare className="w-5 h-5" />,
  'decision-explanation': <Scale className="w-5 h-5" />,
}

const typeLabels: Record<string, string> = {
  'article': 'Article',
  'brief': 'Brief',
  'memo': 'Memo',
  'executive-summary': 'Executive Summary',
  'messaging-framework': 'Messaging Framework',
  'decision-explanation': 'Decision Explanation',
}

export default function WorkProductDetailModal({
  isOpen,
  onClose,
  workProduct,
  workspaceId,
  onWorkProductUpdated,
  onWorkProductDeleted,
}: WorkProductDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (workProduct) {
      setEditTitle(workProduct.title)
      setEditContent(workProduct.content)
    }
  }, [workProduct])

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false)
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!workProduct || !editContent.trim() || !editTitle.trim()) return
    setSaving(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/work-products/${workProduct.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editTitle.trim(),
            content: editContent.trim(),
          }),
        }
      )
      if (response.ok) {
        const data = await response.json()
        onWorkProductUpdated(data.workProduct)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating work product:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!workProduct) return
    if (!confirm('Are you sure you want to delete this work product?')) return
    setDeleting(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/work-products/${workProduct.id}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        onWorkProductDeleted(workProduct.id)
        onClose()
      }
    } catch (error) {
      console.error('Error deleting work product:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleCopy = async () => {
    if (!workProduct) return
    try {
      await navigator.clipboard.writeText(workProduct.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const handleExport = (format: 'md' | 'txt') => {
    if (!workProduct) return
    const content = format === 'md'
      ? `# ${workProduct.title}\n\n${workProduct.content}`
      : `${workProduct.title}\n\n${workProduct.content}`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workProduct.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    if (!saving && !deleting) {
      setIsEditing(false)
      onClose()
    }
  }

  if (!workProduct) return null

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
              className="bg-background border border-text/10 rounded-sm shadow-2xl w-full max-w-[800px] pointer-events-auto my-auto max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="border-b border-text/10 bg-background-alt p-6 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      {typeIcons[workProduct.type] || <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                          {typeLabels[workProduct.type] || workProduct.type}
                        </span>
                      </div>
                      <p className="text-sm text-text/60 mt-1">
                        Created {formatTimestamp(workProduct.createdAt)}
                        {workProduct.createdByName && (
                          <span className="ml-1">by {workProduct.createdByName}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={saving || deleting}
                    className="p-2 hover:bg-background rounded-sm transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-text/60" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        maxLength={500}
                        className="w-full px-4 py-2 bg-background-alt border border-text/15 rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Content
                      </label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={15}
                        className="w-full px-4 py-3 bg-background-alt border border-text/15 rounded-sm text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-xl font-heading font-bold text-text">
                      {workProduct.title}
                    </h2>
                    <div className="prose prose-sm max-w-none">
                      <div className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                        {workProduct.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-text/10 p-4 flex-shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-3 py-2 text-sm font-medium text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-sm hover:border-red-300 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {deleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false)
                            setEditTitle(workProduct.title)
                            setEditContent(workProduct.content)
                          }}
                          disabled={saving}
                          className="px-3 py-2 text-sm font-medium text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving || !editContent.trim() || !editTitle.trim()}
                          className="px-4 py-2 text-sm font-medium bg-text text-background rounded-sm hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save
                        </button>
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="px-3 py-2 text-sm font-medium text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                      <div className="relative group">
                        <button className="px-3 py-2 text-sm font-medium text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                        <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block">
                          <div className="bg-background border border-text/10 rounded-sm shadow-lg p-1 min-w-[100px]">
                            <button
                              onClick={() => handleExport('md')}
                              className="w-full px-3 py-1.5 text-sm text-left hover:bg-background-alt rounded-sm transition-colors"
                            >
                              Markdown
                            </button>
                            <button
                              onClick={() => handleExport('txt')}
                              className="w-full px-3 py-1.5 text-sm text-left hover:bg-background-alt rounded-sm transition-colors"
                            >
                              Plain Text
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
