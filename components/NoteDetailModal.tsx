'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Sparkles, PenLine, Trash2, Save, FileText,
  ChevronDown, Loader2
} from 'lucide-react'

type NoteType = 'ai-generated' | 'user-added'

interface WorkspaceNote {
  id: string
  title: string | null
  content: string
  type: NoteType
  createdAt: string
  updatedAt: string
}

interface NoteDetailModalProps {
  isOpen: boolean
  onClose: () => void
  note: WorkspaceNote | null
  workspaceId: string
  onNoteUpdated: (note: WorkspaceNote) => void
  onNoteDeleted: (noteId: string) => void
  onGenerateWorkProduct: (note: WorkspaceNote) => void
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

const workProductTypes = [
  { value: 'article', label: 'Article', description: 'Long-form content piece' },
  { value: 'brief', label: 'Brief', description: 'Concise summary document' },
  { value: 'memo', label: 'Memo', description: 'Professional memorandum' },
  { value: 'executive-summary', label: 'Executive Summary', description: 'High-level overview for leadership' },
  { value: 'messaging-framework', label: 'Messaging Framework', description: 'Key messages and talking points' },
  { value: 'decision-explanation', label: 'Decision Explanation', description: 'Document linking conclusions to data' },
] as const

export default function NoteDetailModal({
  isOpen,
  onClose,
  note,
  workspaceId,
  onNoteUpdated,
  onNoteDeleted,
  onGenerateWorkProduct,
}: NoteDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showWorkProductMenu, setShowWorkProductMenu] = useState(false)

  useEffect(() => {
    if (note) {
      setEditContent(note.content)
      setEditTitle(note.title || '')
    }
  }, [note])

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false)
      setShowWorkProductMenu(false)
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!note || !editContent.trim()) return
    setSaving(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/notes/${note.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: editContent.trim(),
            title: editTitle.trim() || undefined,
          }),
        }
      )
      if (response.ok) {
        const data = await response.json()
        onNoteUpdated(data.note)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating note:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!note) return
    if (!confirm('Are you sure you want to delete this note?')) return
    setDeleting(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/notes/${note.id}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        onNoteDeleted(note.id)
        onClose()
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleClose = () => {
    if (!saving && !deleting) {
      setIsEditing(false)
      setShowWorkProductMenu(false)
      onClose()
    }
  }

  if (!note) return null

  const isAI = note.type === 'ai-generated'

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
              {/* Header */}
              <div className={`border-b border-text/10 p-6 flex-shrink-0 ${
                isAI ? 'bg-accent/5' : 'bg-background-alt'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isAI ? 'bg-accent/10' : 'bg-text/10'
                    }`}>
                      {isAI ? (
                        <Sparkles className="w-5 h-5 text-accent" />
                      ) : (
                        <PenLine className="w-5 h-5 text-text/60" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${
                          isAI ? 'text-accent' : 'text-text/60'
                        }`}>
                          {isAI ? 'AI-Generated Note' : 'Your Note'}
                        </span>
                      </div>
                      <p className="text-sm text-text/60 mt-1">
                        {formatTimestamp(note.createdAt)}
                        {note.updatedAt !== note.createdAt && (
                          <span className="ml-2">(edited)</span>
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
                        Title <span className="text-text/40">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Add a title..."
                        maxLength={200}
                        className="w-full px-3 py-2 bg-background-alt border border-text/15 rounded-sm text-sm text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Content
                      </label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={10}
                        className="w-full px-3 py-2 bg-background-alt border border-text/15 rounded-sm text-sm text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {note.title && (
                      <h3 className="text-lg font-semibold text-text">
                        {note.title}
                      </h3>
                    )}
                    <div className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-text/10 p-4 flex-shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {!isAI && !isEditing && (
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
                    )}
                    {isEditing && (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false)
                            setEditContent(note.content)
                            setEditTitle(note.title || '')
                          }}
                          disabled={saving}
                          className="px-3 py-2 text-sm font-medium text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving || !editContent.trim()}
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
                    <div className="relative">
                      <button
                        onClick={() => setShowWorkProductMenu(!showWorkProductMenu)}
                        className="px-4 py-2 text-sm font-medium bg-accent/10 text-accent border border-accent/30 rounded-sm hover:bg-accent/20 transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Generate Work Product
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          showWorkProductMenu ? 'rotate-180' : ''
                        }`} />
                      </button>

                      <AnimatePresence>
                        {showWorkProductMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute bottom-full right-0 mb-2 w-72 bg-background border border-text/10 rounded-sm shadow-xl z-10"
                          >
                            <div className="p-2 border-b border-text/10">
                              <span className="text-xs font-semibold uppercase tracking-wider text-text/60">
                                Select Type
                              </span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {workProductTypes.map((type) => (
                                <button
                                  key={type.value}
                                  onClick={() => {
                                    setShowWorkProductMenu(false)
                                    onGenerateWorkProduct(note)
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-background-alt transition-colors"
                                >
                                  <div className="text-sm font-medium text-text">
                                    {type.label}
                                  </div>
                                  <div className="text-xs text-text/60">
                                    {type.description}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
