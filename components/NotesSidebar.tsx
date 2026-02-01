'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sparkles, PenLine, Plus, FileText, FolderOpen } from 'lucide-react'
import NoteDetailModal from './NoteDetailModal'
import WorkProductGenerationModal from './WorkProductGenerationModal'

type NoteType = 'ai-generated' | 'user-added'

interface WorkspaceNote {
  id: string
  title: string | null
  content: string
  type: NoteType
  createdAt: string
  updatedAt: string
}

interface NotesSidebarProps {
  workspaceId: string
}

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
  // Get content after the first line
  const lines = content.split('\n')
  const restContent = lines.slice(1).join(' ').trim() || lines[0]
  const cleaned = restContent.replace(/\s+/g, ' ').trim()
  return cleaned.length <= maxLength
    ? cleaned
    : cleaned.substring(0, maxLength) + '...'
}

export default function NotesSidebar({ workspaceId }: NotesSidebarProps) {
  const [notes, setNotes] = useState<WorkspaceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedNote, setSelectedNote] = useState<WorkspaceNote | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showGenerationModal, setShowGenerationModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'notes' | 'products'>('notes')
  const [workProductsCount, setWorkProductsCount] = useState(0)

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

  const fetchWorkProductsCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/work-products`)
      if (response.ok) {
        const data = await response.json()
        setWorkProductsCount(data.workProducts?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching work products count:', error)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchNotes()
    fetchWorkProductsCount()
  }, [fetchNotes, fetchWorkProductsCount])

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

  const handleNoteUpdated = (updatedNote: WorkspaceNote) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === updatedNote.id ? updatedNote : note))
    )
    setSelectedNote(updatedNote)
  }

  const handleNoteDeleted = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
    setSelectedNote(null)
  }

  const handleGenerateWorkProduct = (note: WorkspaceNote) => {
    setSelectedNote(note)
    setShowNoteModal(false)
    setShowGenerationModal(true)
  }

  const handleWorkProductSaved = () => {
    fetchWorkProductsCount()
    setActiveTab('products')
  }

  const notesSorted = useMemo(
    () =>
      [...notes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notes]
  )

  return (
    <div className="h-full flex flex-col border-r border-text/10 bg-background-alt">
      {/* Header */}
      <div className="p-4 border-b border-text/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-heading font-semibold text-text">Notes & Work Products</h3>
            <p className="text-xs text-text/60 mt-1">
              Insights and generated documents
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-text/10">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'notes'
              ? 'text-accent border-b-2 border-accent bg-accent/5'
              : 'text-text/60 hover:text-text hover:bg-background'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <PenLine className="w-3.5 h-3.5" />
            Notes ({notes.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'products'
              ? 'text-accent border-b-2 border-accent bg-accent/5'
              : 'text-text/60 hover:text-text hover:bg-background'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            Products ({workProductsCount})
          </span>
        </button>
      </div>

      {activeTab === 'notes' ? (
        <>
          {/* New Note Input */}
          <div className="p-4 border-b border-text/10 bg-background">
            <div className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Capture a key insight or reminder..."
                rows={3}
                className="w-full px-3 py-2 bg-background-alt border border-text/15 rounded-sm text-sm text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
              />
              <button
                type="button"
                onClick={handleCreateNote}
                disabled={saving || !newNote.trim()}
                className="w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider bg-text text-background rounded-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>
          </div>

          {/* Notes List - Condensed View */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="text-sm text-text/60 text-center py-8">Loading notes...</div>
            ) : notesSorted.length === 0 ? (
              <div className="text-sm text-text/60 text-center py-8">
                No notes yet. AI will surface highlights here.
              </div>
            ) : (
              notesSorted.map((note) => {
                const isAI = note.type === 'ai-generated'
                const displayTitle = note.title || extractTitle(note.content)
                const preview = extractPreview(note.content)

                return (
                  <button
                    key={note.id}
                    onClick={() => {
                      setSelectedNote(note)
                      setShowNoteModal(true)
                    }}
                    className={`w-full rounded-sm border p-3 text-left transition-all hover:shadow-md ${
                      isAI
                        ? 'border-accent/30 bg-accent/5 hover:bg-accent/10'
                        : 'border-text/10 bg-background hover:bg-background-alt'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
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
                        {isAI ? 'AI' : 'You'}
                      </span>
                      <span className="text-xs text-text/40">
                        {formatTimestamp(note.createdAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-medium text-text line-clamp-1 mb-1">
                      {displayTitle}
                    </h4>

                    {/* Preview */}
                    <p className="text-xs text-text/60 line-clamp-2">
                      {preview}
                    </p>
                  </button>
                )
              })
            )}
          </div>
        </>
      ) : (
        /* Work Products Tab */
        <div className="flex-1 overflow-y-auto">
          <WorkProductsListInline
            workspaceId={workspaceId}
            onRefresh={fetchWorkProductsCount}
          />
        </div>
      )}

      {/* Note Detail Modal */}
      <NoteDetailModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        note={selectedNote}
        workspaceId={workspaceId}
        onNoteUpdated={handleNoteUpdated}
        onNoteDeleted={handleNoteDeleted}
        onGenerateWorkProduct={handleGenerateWorkProduct}
      />

      {/* Work Product Generation Modal */}
      <WorkProductGenerationModal
        isOpen={showGenerationModal}
        onClose={() => setShowGenerationModal(false)}
        note={selectedNote}
        workspaceId={workspaceId}
        onWorkProductSaved={handleWorkProductSaved}
      />
    </div>
  )
}

// Inline component for work products list within the sidebar
function WorkProductsListInline({
  workspaceId,
  onRefresh,
}: {
  workspaceId: string
  onRefresh: () => void
}) {
  const [workProducts, setWorkProducts] = useState<{
    id: string
    title: string
    type: string
    createdAt: string
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)

  useEffect(() => {
    const fetchWorkProducts = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/work-products`)
        if (response.ok) {
          const data = await response.json()
          setWorkProducts(data.workProducts || [])
        }
      } catch (error) {
        console.error('Error fetching work products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchWorkProducts()
  }, [workspaceId, onRefresh])

  const typeLabels: Record<string, string> = {
    'article': 'Article',
    'brief': 'Brief',
    'memo': 'Memo',
    'executive-summary': 'Executive Summary',
    'messaging-framework': 'Messaging',
    'decision-explanation': 'Decision',
  }

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-text/60 text-center">
        Loading work products...
      </div>
    )
  }

  if (workProducts.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-text/5 flex items-center justify-center mx-auto mb-3">
          <FolderOpen className="w-6 h-6 text-text/40" />
        </div>
        <p className="text-sm text-text/60 mb-2">No work products yet</p>
        <p className="text-xs text-text/40">
          Generate documents from your notes
        </p>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-2">
      {workProducts.map((product) => (
        <a
          key={product.id}
          href={`/app/workspaces/${workspaceId}/work-products/${product.id}`}
          className="block w-full rounded-sm border border-text/10 bg-background p-3 text-left transition-all hover:shadow-md hover:bg-background-alt"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-accent">
              <FileText className="w-3 h-3" />
              {typeLabels[product.type] || product.type}
            </span>
            <span className="text-xs text-text/40">
              {formatTimestamp(product.createdAt)}
            </span>
          </div>
          <h4 className="text-sm font-medium text-text line-clamp-2">
            {product.title}
          </h4>
        </a>
      ))}
    </div>
  )
}
