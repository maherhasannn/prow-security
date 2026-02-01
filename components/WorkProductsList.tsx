'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  FileText, FolderOpen, Filter, Loader2,
  FileEdit, Briefcase, Mail, BarChart3, MessageSquare, Scale
} from 'lucide-react'
import WorkProductDetailModal from './WorkProductDetailModal'

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

interface WorkProductsListProps {
  workspaceId: string
}

const typeIcons: Record<string, React.ReactNode> = {
  'article': <FileEdit className="w-4 h-4" />,
  'brief': <Briefcase className="w-4 h-4" />,
  'memo': <Mail className="w-4 h-4" />,
  'executive-summary': <BarChart3 className="w-4 h-4" />,
  'messaging-framework': <MessageSquare className="w-4 h-4" />,
  'decision-explanation': <Scale className="w-4 h-4" />,
}

const typeLabels: Record<string, string> = {
  'article': 'Article',
  'brief': 'Brief',
  'memo': 'Memo',
  'executive-summary': 'Executive Summary',
  'messaging-framework': 'Messaging Framework',
  'decision-explanation': 'Decision Explanation',
}

const allTypes = [
  'article', 'brief', 'memo',
  'executive-summary', 'messaging-framework', 'decision-explanation'
]

const formatTimestamp = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function WorkProductsList({ workspaceId }: WorkProductsListProps) {
  const [workProducts, setWorkProducts] = useState<WorkProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<WorkProduct | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filterType, setFilterType] = useState<string | null>(null)

  const fetchWorkProducts = useCallback(async () => {
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
  }, [workspaceId])

  useEffect(() => {
    fetchWorkProducts()
  }, [fetchWorkProducts])

  const handleProductUpdated = (updatedProduct: WorkProduct) => {
    setWorkProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    )
    setSelectedProduct(updatedProduct)
  }

  const handleProductDeleted = (productId: string) => {
    setWorkProducts((prev) => prev.filter((p) => p.id !== productId))
    setSelectedProduct(null)
  }

  const filteredProducts = filterType
    ? workProducts.filter((p) => p.type === filterType)
    : workProducts

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-text/40" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with filter */}
      <div className="p-4 border-b border-text/10 bg-background-alt">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-heading font-semibold text-text">
              Work Products
            </h3>
            <p className="text-xs text-text/60 mt-1">
              {filteredProducts.length} document{filteredProducts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="relative">
            <select
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="appearance-none pl-8 pr-8 py-2 bg-background border border-text/20 rounded-sm text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">All Types</option>
              {allTypes.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text/40" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-text/5 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-text/40" />
            </div>
            <p className="text-sm text-text/60 mb-2">
              {filterType ? 'No work products of this type' : 'No work products yet'}
            </p>
            <p className="text-xs text-text/40">
              Generate documents from your notes to see them here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-text/10">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product)
                  setShowModal(true)
                }}
                className="w-full p-4 text-left hover:bg-background-alt transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                    {typeIcons[product.type] || <FileText className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                        {typeLabels[product.type] || product.type}
                      </span>
                      <span className="text-xs text-text/40">
                        {formatTimestamp(product.createdAt)}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-text line-clamp-1 mb-1">
                      {product.title}
                    </h4>
                    <p className="text-xs text-text/60 line-clamp-2">
                      {product.content.substring(0, 150)}...
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <WorkProductDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        workProduct={selectedProduct}
        workspaceId={workspaceId}
        onWorkProductUpdated={handleProductUpdated}
        onWorkProductDeleted={handleProductDeleted}
      />
    </div>
  )
}
