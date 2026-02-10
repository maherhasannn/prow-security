'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Sparkles,
  PenLine,
  Plus,
  FileText,
  FileEdit,
  Briefcase,
  Mail,
  BarChart3,
  MessageSquare,
  Scale,
  Loader2,
  Copy,
  Check,
  Save,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import type { WorkProductType } from '@/lib/utils/validation'

type NoteType = 'ai-generated' | 'user-added'

interface WorkspaceNote {
  id: string
  title: string | null
  content: string
  type: NoteType
  createdAt: string
  updatedAt: string
}

interface NotesOverlayProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
}

const workProductTypes: {
  value: WorkProductType
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    value: 'article',
    label: 'Article',
    description: 'Long-form content piece',
    icon: <FileEdit className="w-5 h-5" />,
  },
  {
    value: 'brief',
    label: 'Brief',
    description: 'Concise summary document',
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    value: 'memo',
    label: 'Memo',
    description: 'Professional memorandum',
    icon: <Mail className="w-5 h-5" />,
  },
  {
    value: 'executive-summary',
    label: 'Executive Summary',
    description: 'High-level overview for leadership',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    value: 'messaging-framework',
    label: 'Messaging Framework',
    description: 'Key messages and talking points',
    icon: <MessageSquare className="w-5 h-5" />,
  },
]

const formatTimestamp = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const extractTitle = (content: string, maxLength = 50): string => {
  const firstLine = content.split('\n')[0].trim()
  return firstLine.length <= maxLength
    ? firstLine
    : firstLine.substring(0, maxLength) + '...'
}

const extractPreview = (content: string, maxLength = 100): string => {
  const lines = content.split('\n')
  const restContent = lines.slice(1).join(' ').trim() || lines[0]
  const cleaned = restContent.replace(/\s+/g, ' ').trim()
  return cleaned.length <= maxLength
    ? cleaned
    : cleaned.substring(0, maxLength) + '...'
}

export default function NotesOverlay({
  isOpen,
  onClose,
  workspaceId,
}: NotesOverlayProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'create'>('notes')
  const [notes, setNotes] = useState<WorkspaceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Work product creation state
  const [selectedNote, setSelectedNote] = useState<WorkspaceNote | null>(null)
  const [selectedType, setSelectedType] = useState<WorkProductType | null>(null)
  const [additionalContext, setAdditionalContext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [generatedTitle, setGeneratedTitle] = useState('')
  const [savingWorkProduct, setSavingWorkProduct] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    if (isOpen) {
      fetchNotes()
    }
  }, [isOpen, fetchNotes])

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('notes')
      setSelectedNote(null)
      setSelectedType(null)
      setAdditionalContext('')
      setGeneratedContent('')
      setGeneratedTitle('')
      setGenerating(false)
      setSavingWorkProduct(false)
    }
  }, [isOpen])

  const handleCreateNote = async () => {
    if (!newNote.trim()) return
    setSaving(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      })
      if (response.ok) {
        const data = await response.json()
        setNotes((prev) => [...prev, data.note])
        setNewNote('')
      }
    } catch (error) {
      console.error('Error creating note:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/notes/${noteId}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId))
        if (selectedNote?.id === noteId) {
          setSelectedNote(null)
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const handleSelectNoteForGeneration = (note: WorkspaceNote) => {
    setSelectedNote(note)
    setActiveTab('create')
  }

  const handleGenerate = async () => {
    if (!selectedNote || !selectedType) return

    setGenerating(true)
    setGeneratedContent('')
    setGeneratedTitle('')

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/work-products/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noteId: selectedNote.id,
            type: selectedType,
            additionalContext: additionalContext.trim() || undefined,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let fullContent = ''
      let titleExtracted = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((line) => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                fullContent += data.content
                setGeneratedContent(fullContent)

                if (!titleExtracted && fullContent.includes('\n')) {
                  const firstLine = fullContent.split('\n')[0].replace(/^#\s*/, '').trim()
                  if (firstLine) {
                    setGeneratedTitle(firstLine)
                    titleExtracted = true
                  }
                }
              }
              if (data.title) {
                setGeneratedTitle(data.title)
                titleExtracted = true
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      if (!titleExtracted && fullContent) {
        const firstLine = fullContent.split('\n')[0].replace(/^#\s*/, '').trim()
        setGeneratedTitle(
          firstLine ||
            `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} - ${new Date().toLocaleDateString()}`
        )
      }
    } catch (error) {
      console.error('Error generating work product:', error)
      setGeneratedContent('Error generating work product. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveWorkProduct = async () => {
    if (!selectedNote || !selectedType || !generatedContent) return

    setSavingWorkProduct(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/work-products`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noteId: selectedNote.id,
            type: selectedType,
            title: generatedTitle || `${selectedType} - ${new Date().toLocaleDateString()}`,
            content: generatedContent,
          }),
        }
      )

      if (response.ok) {
        // Reset and close
        setGeneratedContent('')
        setGeneratedTitle('')
        setSelectedNote(null)
        setSelectedType(null)
        setAdditionalContext('')
        onClose()
      }
    } catch (error) {
      console.error('Error saving work product:', error)
    } finally {
      setSavingWorkProduct(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const notesSorted = useMemo(
    () =>
      [...notes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notes]
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Overlay Panel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-background border-l border-text/10 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-text/10 bg-background-alt p-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-bold text-text">
                      Notes & Work Products
                    </h2>
                    <p className="text-sm text-text/60">
                      Capture insights and generate documents
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-background rounded-sm transition-colors"
                >
                  <X className="w-5 h-5 text-text/60" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-text/10 bg-background">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'text-accent border-b-2 border-accent bg-accent/5'
                    : 'text-text/60 hover:text-text hover:bg-background-alt'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <PenLine className="w-4 h-4" />
                  My Notes ({notes.length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'text-accent border-b-2 border-accent bg-accent/5'
                    : 'text-text/60 hover:text-text hover:bg-background-alt'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Create Work Product
                </span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'notes' ? (
                <div className="p-5 space-y-4">
                  {/* New Note Input */}
                  <div className="space-y-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Capture a key insight or reminder..."
                      rows={3}
                      className="w-full px-4 py-3 bg-background-alt border border-text/15 rounded-sm text-sm text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNote}
                      disabled={saving || !newNote.trim()}
                      className="w-full px-4 py-2.5 text-sm font-medium bg-text text-background rounded-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Note
                    </button>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-sm text-text/60 text-center py-8">
                        Loading notes...
                      </div>
                    ) : notesSorted.length === 0 ? (
                      <div className="text-sm text-text/60 text-center py-8">
                        No notes yet. Add one above or let AI surface highlights.
                      </div>
                    ) : (
                      notesSorted.map((note) => {
                        const isAI = note.type === 'ai-generated'
                        const displayTitle = note.title || extractTitle(note.content)
                        const preview = extractPreview(note.content)

                        return (
                          <div
                            key={note.id}
                            className={`rounded-sm border p-4 transition-all ${
                              isAI
                                ? 'border-accent/30 bg-accent/5'
                                : 'border-text/10 bg-background-alt'
                            }`}
                          >
                            {/* Header Row */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider ${
                                  isAI ? 'text-accent' : 'text-text/50'
                                }`}
                              >
                                {isAI ? (
                                  <Sparkles className="w-3 h-3" />
                                ) : (
                                  <PenLine className="w-3 h-3" />
                                )}
                                {isAI ? 'AI Generated' : 'Your Note'}
                              </span>
                              <span className="text-xs text-text/40">
                                {formatTimestamp(note.createdAt)}
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="text-sm font-medium text-text mb-1">
                              {displayTitle}
                            </h4>

                            {/* Preview */}
                            <p className="text-xs text-text/60 mb-3 line-clamp-2">
                              {preview}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSelectNoteForGeneration(note)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 rounded-sm hover:bg-accent/20 transition-colors"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                Generate Work Product
                                <ChevronRight className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1.5 text-text/40 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-5">
                  {!generatedContent ? (
                    <>
                      {/* Selected Note */}
                      {selectedNote ? (
                        <div className="p-4 bg-accent/5 border border-accent/20 rounded-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                              Source Note
                            </span>
                            <button
                              onClick={() => setSelectedNote(null)}
                              className="text-xs text-text/60 hover:text-text"
                            >
                              Change
                            </button>
                          </div>
                          <p className="text-sm text-text/80 line-clamp-3">
                            {selectedNote.content}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-background-alt border border-text/10 rounded-sm text-center">
                          <p className="text-sm text-text/60 mb-2">
                            Select a note to generate from
                          </p>
                          <button
                            onClick={() => setActiveTab('notes')}
                            className="text-sm text-accent hover:underline"
                          >
                            Go to My Notes
                          </button>
                        </div>
                      )}

                      {/* Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-text mb-3">
                          Select Type
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {workProductTypes.map((type) => (
                            <button
                              key={type.value}
                              onClick={() => setSelectedType(type.value)}
                              disabled={generating || !selectedNote}
                              className={`p-3 border rounded-sm text-left transition-all disabled:opacity-50 ${
                                selectedType === type.value
                                  ? 'border-accent/40 bg-accent/5 shadow-sm'
                                  : 'border-text/10 bg-background-alt hover:border-text/20'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex-shrink-0 ${
                                    selectedType === type.value
                                      ? 'text-accent'
                                      : 'text-text/60'
                                  }`}
                                >
                                  {type.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-text">
                                    {type.label}
                                  </div>
                                  <div className="text-xs text-text/60">
                                    {type.description}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Additional Context */}
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          Additional Context{' '}
                          <span className="text-text/40">(Optional)</span>
                        </label>
                        <textarea
                          value={additionalContext}
                          onChange={(e) => setAdditionalContext(e.target.value)}
                          placeholder="Add any specific instructions, audience details, or focus areas..."
                          rows={3}
                          maxLength={2000}
                          disabled={generating || !selectedNote}
                          className="w-full px-4 py-3 bg-background-alt border border-text/20 rounded-sm text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none disabled:opacity-50"
                        />
                      </div>

                      {/* Generate Button */}
                      <button
                        onClick={handleGenerate}
                        disabled={generating || !selectedType || !selectedNote}
                        className="w-full px-6 py-3 text-sm font-medium bg-text text-background rounded-sm hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate Work Product
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {/* Generated Title */}
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={generatedTitle}
                          onChange={(e) => setGeneratedTitle(e.target.value)}
                          className="w-full px-4 py-2 bg-background-alt border border-text/20 rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                        />
                      </div>

                      {/* Generated Content */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-text">
                            Generated Content
                          </label>
                          <button
                            onClick={handleCopy}
                            className="flex items-center gap-1 text-xs text-text/60 hover:text-text transition-colors"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="w-full min-h-[250px] max-h-[350px] overflow-y-auto px-4 py-3 bg-background-alt border border-text/20 rounded-sm text-sm text-text whitespace-pre-wrap">
                          {generatedContent}
                          {generating && (
                            <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-1" />
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setGeneratedContent('')
                            setGeneratedTitle('')
                          }}
                          className="flex-1 px-4 py-2 text-sm font-medium text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Discard
                        </button>
                        <button
                          onClick={handleSaveWorkProduct}
                          disabled={savingWorkProduct}
                          className="flex-1 px-6 py-2 text-sm font-medium bg-text text-background rounded-sm hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {savingWorkProduct ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save Work Product
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
