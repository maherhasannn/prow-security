'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, FileText, Trash2, Save, Copy, Check, Download,
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

export default function WorkProductPage({
  params,
}: {
  params: { id: string; productId: string }
}) {
  const router = useRouter()
  const [workProduct, setWorkProduct] = useState<WorkProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchWorkProduct = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/workspaces/${params.id}/work-products/${params.productId}`
      )
      if (response.ok) {
        const data = await response.json()
        setWorkProduct(data.workProduct)
        setEditTitle(data.workProduct.title)
        setEditContent(data.workProduct.content)
      } else if (response.status === 404) {
        router.push(`/app/workspaces/${params.id}`)
      }
    } catch (error) {
      console.error('Error fetching work product:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id, params.productId, router])

  useEffect(() => {
    fetchWorkProduct()
  }, [fetchWorkProduct])

  const handleSave = async () => {
    if (!workProduct || !editContent.trim() || !editTitle.trim()) return
    setSaving(true)
    try {
      const response = await fetch(
        `/api/workspaces/${params.id}/work-products/${params.productId}`,
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
        setWorkProduct(data.workProduct)
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
        `/api/workspaces/${params.id}/work-products/${params.productId}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        router.push(`/app/workspaces/${params.id}`)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!workProduct) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text/60 mb-4">Work product not found</p>
          <Link
            href={`/app/workspaces/${params.id}`}
            className="text-accent hover:underline"
          >
            Return to workspace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-text/10 bg-background-alt">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/app/workspaces/${params.id}`}
                className="flex items-center gap-2 text-sm text-text/60 hover:text-text transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Workspace
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors"
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
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <div className="absolute top-full right-0 mt-1 hidden group-hover:block z-10">
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
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-2 text-sm font-medium text-text/70 hover:text-text border border-text/20 rounded-sm hover:border-text/40 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-sm hover:border-red-300 transition-colors disabled:opacity-50"
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
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-text text-background rounded-sm hover:bg-accent transition-colors disabled:opacity-50"
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
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            {typeIcons[workProduct.type] || <FileText className="w-6 h-6" />}
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              {typeLabels[workProduct.type] || workProduct.type}
            </span>
            <p className="text-sm text-text/60">
              Created {formatTimestamp(workProduct.createdAt)}
              {workProduct.createdByName && (
                <span className="ml-1">by {workProduct.createdByName}</span>
              )}
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={500}
                className="w-full px-4 py-3 bg-background-alt border border-text/15 rounded-sm text-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Content
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={25}
                className="w-full px-4 py-3 bg-background-alt border border-text/15 rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none font-mono text-sm leading-relaxed"
              />
            </div>
          </div>
        ) : (
          <article className="prose prose-lg max-w-none">
            <h1 className="text-3xl font-heading font-bold text-text mb-8">
              {workProduct.title}
            </h1>
            <div className="text-text leading-relaxed whitespace-pre-wrap">
              {workProduct.content}
            </div>
          </article>
        )}
      </main>
    </div>
  )
}
