'use client'

import { useState, useEffect } from 'react'
import { FileText, FileSpreadsheet, File, Check } from 'lucide-react'

interface Document {
  id: string
  name: string
  type: 'excel' | 'csv' | 'pdf' | 'quickbooks'
  createdAt: string
}

interface DocumentSidebarProps {
  workspaceId: string
  selectedDocuments: string[]
  onSelectDocument: (documentId: string) => void
}

export default function DocumentSidebar({
  workspaceId,
  selectedDocuments,
  onSelectDocument,
}: DocumentSidebarProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [workspaceId])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4" />
      case 'excel':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4" />
      default:
        return <File className="w-4 h-4" />
    }
  }

  return (
    <div className="h-full flex flex-col border-r border-text/10 bg-background-alt">
      <div className="p-4 border-b border-text/10">
        <h3 className="text-sm font-heading font-semibold text-text">
          Documents
        </h3>
        <p className="text-xs text-text/60 mt-1">
          Select documents for context
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-sm text-text/60 text-center py-8">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-sm text-text/60 text-center py-8">
            No documents yet
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map((doc) => {
              const isSelected = selectedDocuments.includes(doc.id)
              return (
                <button
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className={`w-full text-left p-3 rounded-sm transition-colors flex items-start gap-3 ${
                    isSelected
                      ? 'bg-accent/10 border border-accent/20'
                      : 'hover:bg-background border border-transparent'
                  }`}
                >
                  <div className="text-text/60 mt-0.5 flex-shrink-0">
                    {getDocumentIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text truncate">
                      {doc.name}
                    </div>
                    <div className="text-xs text-text/50 mt-0.5">
                      {doc.type.toUpperCase()}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

