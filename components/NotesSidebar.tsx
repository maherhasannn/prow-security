'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sparkles, PenLine, Plus, Trash2, Save } from 'lucide-react'

type NoteType = 'ai-generated' | 'user-added'

interface WorkspaceNote {
  id: string
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

export default function NotesSidebar({ workspaceId }: NotesSidebarProps) {
  const [notes, setNotes] = useState<WorkspaceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

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
    fetchNotes()
  }, [fetchNotes])

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
        setNotes((prev) => prev.filter((note) => note.id !== noteId))
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editingContent.trim()) return
    setSaving(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/notes/${noteId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editingContent.trim() }),
        }
      )
      if (response.ok) {
        const data = await response.json()
        setNotes((prev) =>
          prev.map((note) => (note.id === noteId ? data.note : note))
        )
        setEditingNoteId(null)
        setEditingContent('')
      }
    } catch (error) {
      console.error('Error updating note:', error)
    } finally {
      setSaving(false)
    }
  }

  const notesSorted = useMemo(
    () =>
      [...notes].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [notes]
  )

  return (
    <div className="h-full flex flex-col border-r border-text/10 bg-background-alt">
      <div className="p-4 border-b border-text/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-heading font-semibold text-text">Notes</h3>
            <p className="text-xs text-text/60 mt-1">
              Important insights saved across sessions
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
        </div>
      </div>

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

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="text-sm text-text/60 text-center py-8">Loading notes...</div>
        ) : notesSorted.length === 0 ? (
          <div className="text-sm text-text/60 text-center py-8">
            No notes yet. AI will surface highlights here.
          </div>
        ) : (
          notesSorted.map((note) => {
            const isAI = note.type === 'ai-generated'
            const isEditing = editingNoteId === note.id
            return (
              <div
                key={note.id}
                className={`rounded-sm border p-3 shadow-sm transition-all ${
                  isAI
                    ? 'border-accent/30 bg-accent/5'
                    : 'border-text/10 bg-background'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        isAI ? 'text-accent' : 'text-text/60'
                      }`}
                    >
                      {isAI ? (
                        <Sparkles className="w-3.5 h-3.5" />
                      ) : (
                        <PenLine className="w-3.5 h-3.5" />
                      )}
                      {isAI ? 'AI Note' : 'Your Note'}
                    </span>
                  </div>
                  {!isAI && !isEditing && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-text/40 hover:text-text/70 transition-colors"
                      aria-label="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-2 text-sm text-text leading-relaxed">
                  {isEditing ? (
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                      className="w-full px-2 py-2 bg-background-alt border border-text/15 rounded-sm text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
                    />
                  ) : (
                    note.content
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-text/40">
                  <span>{formatTimestamp(note.createdAt)}</span>
                  {!isAI && (
                    <>
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(note.id)}
                          disabled={saving || !editingContent.trim()}
                          className="text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(note.id)
                            setEditingContent(note.content)
                          }}
                          className="text-text/60 hover:text-text/80 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
