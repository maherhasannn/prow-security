'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, FileText, Loader2, Copy, Check, Save, Trash2,
  FileEdit, Briefcase, Mail, BarChart3, MessageSquare, Scale
} from 'lucide-react'
import type { WorkProductType } from '@/lib/utils/validation'

interface WorkspaceNote {
  id: string
  title: string | null
  content: string
  type: 'ai-generated' | 'user-added'
  createdAt: string
  updatedAt: string
}

interface WorkProductGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  note: WorkspaceNote | null
  workspaceId: string
  onWorkProductSaved: () => void
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
    description: 'Transform notes into a well-structured long-form article',
    icon: <FileEdit className="w-5 h-5" />,
  },
  {
    value: 'brief',
    label: 'Brief',
    description: 'Create a concise brief summarizing key points',
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    value: 'memo',
    label: 'Memo',
    description: 'Draft a professional memorandum based on insights',
    icon: <Mail className="w-5 h-5" />,
  },
  {
    value: 'executive-summary',
    label: 'Executive Summary',
    description: 'Create a high-level overview for leadership',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    value: 'messaging-framework',
    label: 'Messaging Framework',
    description: 'Develop key messages, talking points, and positioning',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    value: 'decision-explanation',
    label: 'Decision Explanation',
    description: 'Document linking conclusions to supporting data',
    icon: <Scale className="w-5 h-5" />,
  },
]

export default function WorkProductGenerationModal({
  isOpen,
  onClose,
  note,
  workspaceId,
  onWorkProductSaved,
}: WorkProductGenerationModalProps) {
  const [selectedType, setSelectedType] = useState<WorkProductType | null>(null)
  const [additionalContext, setAdditionalContext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [generatedTitle, setGeneratedTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null)
      setAdditionalContext('')
      setGeneratedContent('')
      setGeneratedTitle('')
      setGenerating(false)
      setSaving(false)
    }
  }, [isOpen])

  const handleGenerate = async () => {
    if (!note || !selectedType) return

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
            noteId: note.id,
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

                // Extract title from first line if not already done
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

      // Final title extraction if not done
      if (!titleExtracted && fullContent) {
        const firstLine = fullContent.split('\n')[0].replace(/^#\s*/, '').trim()
        setGeneratedTitle(firstLine || `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} - ${new Date().toLocaleDateString()}`)
      }
    } catch (error) {
      console.error('Error generating work product:', error)
      setGeneratedContent('Error generating work product. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!note || !selectedType || !generatedContent) return

    setSaving(true)
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/work-products`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noteId: note.id,
            type: selectedType,
            title: generatedTitle || `${selectedType} - ${new Date().toLocaleDateString()}`,
            content: generatedContent,
          }),
        }
      )

      if (response.ok) {
        onWorkProductSaved()
        onClose()
      }
    } catch (error) {
      console.error('Error saving work product:', error)
    } finally {
      setSaving(false)
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

  const handleClose = () => {
    if (!generating && !saving) {
      onClose()
    }
  }

  if (!note) return null

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
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-xl font-heading font-bold text-text">
                        Generate Work Product
                      </h2>
                      <p className="text-sm text-text/60 mt-1">
                        Transform your note into a professional document
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={generating || saving}
                    className="p-2 hover:bg-background rounded-sm transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-text/60" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {!generatedContent ? (
                  <div className="space-y-6">
                    {/* Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-text mb-3">
                        Select Work Product Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {workProductTypes.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setSelectedType(type.value)}
                            disabled={generating}
                            className={`p-4 border rounded-sm text-left transition-all ${
                              selectedType === type.value
                                ? 'border-accent/40 bg-accent/5 shadow-sm'
                                : 'border-text/10 bg-background-alt hover:border-text/20'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex-shrink-0 mt-0.5 ${
                                selectedType === type.value ? 'text-accent' : 'text-text/60'
                              }`}>
                                {type.icon}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-text">
                                  {type.label}
                                </div>
                                <div className="text-xs text-text/60 mt-1">
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
                        Additional Context <span className="text-text/40">(Optional)</span>
                      </label>
                      <textarea
                        value={additionalContext}
                        onChange={(e) => setAdditionalContext(e.target.value)}
                        placeholder="Add any specific instructions, audience details, or focus areas..."
                        rows={3}
                        maxLength={2000}
                        disabled={generating}
                        className="w-full px-4 py-3 bg-background-alt border border-text/20 rounded-sm text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none disabled:opacity-50"
                      />
                      <p className="text-xs text-text/50 mt-1.5">
                        {additionalContext.length}/2000 characters
                      </p>
                    </div>

                    {/* Source Note Preview */}
                    <div className="p-4 bg-background-alt border border-text/10 rounded-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-text/60">
                          Source Note
                        </span>
                      </div>
                      <p className="text-sm text-text/80 line-clamp-3">
                        {note.content}
                      </p>
                    </div>
                  </div>
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
                      <div
                        ref={contentRef}
                        className="w-full min-h-[300px] max-h-[400px] overflow-y-auto px-4 py-3 bg-background-alt border border-text/20 rounded-sm text-sm text-text whitespace-pre-wrap"
                      >
                        {generatedContent}
                        {generating && (
                          <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-1" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-text/10 p-4 flex-shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleClose}
                    disabled={generating || saving}
                    className="px-4 py-2 text-sm font-medium text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-3">
                    {generatedContent && !generating && (
                      <>
                        <button
                          onClick={() => {
                            setGeneratedContent('')
                            setGeneratedTitle('')
                          }}
                          className="px-4 py-2 text-sm font-medium text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Discard
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-6 py-2 text-sm font-medium bg-text text-background rounded-sm hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save Work Product
                        </button>
                      </>
                    )}
                    {!generatedContent && (
                      <button
                        onClick={handleGenerate}
                        disabled={generating || !selectedType}
                        className="px-6 py-2 text-sm font-medium bg-text text-background rounded-sm hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4" />
                            Generate
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
