'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Plus,
  Search,
  FolderOpen,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  Settings,
} from 'lucide-react'
import { useNavigation } from '@/contexts/NavigationContext'

interface Conversation {
  id: string
  title: string | null
  workspaceId: string
  workspaceName?: string
  status: 'active' | 'completed' | 'archived'
  messageCount: number
  updatedAt: string
}

interface Workspace {
  id: string
  name: string
  description: string | null
  mode: 'secure' | 'core'
  createdAt: string
}

interface Document {
  id: string
  name: string
  type: string
  workspaceId: string
  createdAt: string
}

type SidebarSection = 'chats' | 'projects' | 'images'

interface LeftSidebarProps {
  workspaceId?: string
  activeConversationId?: string | null
  onSelectConversation?: (conversationId: string | null) => void
  onNewConversation?: () => void
  refreshTrigger?: number
}

export default function LeftSidebar({
  workspaceId,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  refreshTrigger,
}: LeftSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { state, setSidebarCollapsed, setSidebarSection } = useNavigation()
  const { sidebarCollapsed, sidebarSection } = state

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!workspaceId) return
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/conversations`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }, [workspaceId])

  // Fetch workspaces (projects)
  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await fetch('/api/workspaces')
      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data.workspaces || [])
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error)
    }
  }, [])

  // Fetch documents (images)
  const fetchDocuments = useCallback(async () => {
    if (!workspaceId) return
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documents`)
      if (response.ok) {
        const data = await response.json()
        // Filter for image types
        const images = (data.documents || []).filter((doc: Document) =>
          ['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(doc.type) ||
          doc.name.match(/\.(png|jpg|jpeg|gif|webp)$/i)
        )
        setDocuments(images)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }, [workspaceId])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchConversations(),
      fetchWorkspaces(),
      fetchDocuments(),
    ]).finally(() => setLoading(false))
  }, [fetchConversations, fetchWorkspaces, fetchDocuments])

  // Refresh conversations when active conversation changes
  useEffect(() => {
    if (activeConversationId && sidebarSection === 'chats') {
      fetchConversations()
    }
  }, [activeConversationId, sidebarSection, fetchConversations])

  // Refresh conversations when refreshTrigger changes (after messages are saved)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchConversations()
    }
  }, [refreshTrigger, fetchConversations])

  const handleDeleteConversation = async (conversationId: string) => {
    if (!workspaceId) return
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/conversations/${conversationId}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        if (activeConversationId === conversationId && onSelectConversation) {
          onSelectConversation(null)
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
    setMenuOpenId(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return conv.status !== 'archived'
    const title = conv.title || 'New conversation'
    return title.toLowerCase().includes(searchQuery.toLowerCase()) && conv.status !== 'archived'
  })

  const filteredWorkspaces = workspaces.filter(ws => {
    if (!searchQuery) return true
    return ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const filteredDocuments = documents.filter(doc => {
    if (!searchQuery) return true
    return doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const sections: { id: SidebarSection; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'chats', label: 'Chats', icon: <MessageSquare className="w-4 h-4" />, count: filteredConversations.length },
    { id: 'projects', label: 'Projects', icon: <FolderOpen className="w-4 h-4" />, count: filteredWorkspaces.length },
    { id: 'images', label: 'Images', icon: <ImageIcon className="w-4 h-4" aria-hidden="true" />, count: filteredDocuments.length },
  ]

  // Collapsed view
  if (sidebarCollapsed) {
    return (
      <div className="w-14 bg-background-elevated border-r border-border h-full flex flex-col shadow-subtle">
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="p-4 hover:bg-background-sunken transition-colors border-b border-border"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5 text-text-muted" />
        </button>

        {/* Section Icons */}
        <div className="flex-1 py-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setSidebarSection(section.id)
                setSidebarCollapsed(false)
              }}
              className={`w-full p-3 hover:bg-background-sunken transition-colors flex justify-center ${
                sidebarSection === section.id ? 'bg-accent-light text-accent' : 'text-text-muted'
              }`}
              title={section.label}
            >
              {section.icon}
            </button>
          ))}
        </div>

        {/* New Chat Button (collapsed) */}
        {workspaceId && onNewConversation && (
          <button
            onClick={onNewConversation}
            className="p-3 hover:bg-accent-light transition-colors border-t border-border group"
            title="New chat"
          >
            <Plus className="w-5 h-5 text-accent group-hover:text-accent-hover" />
          </button>
        )}
      </div>
    )
  }

  // Expanded view
  return (
    <div className="w-72 bg-background-elevated border-r border-border h-full flex flex-col shadow-subtle">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-sm text-text">Workspace</h3>
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="p-1.5 hover:bg-background-sunken rounded-md transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* New Chat Button */}
        {workspaceId && onNewConversation && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onNewConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors mb-3 shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </motion.button>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background-sunken border border-border rounded-md text-sm placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent-muted focus:border-accent transition-all"
          />
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-border bg-background">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setSidebarSection(section.id)}
            className={`flex-1 py-2.5 px-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              sidebarSection === section.id
                ? 'text-accent border-b-2 border-accent bg-accent-light'
                : 'text-text-muted hover:text-text-secondary hover:bg-background-sunken'
            }`}
          >
            {section.icon}
            <span className="hidden sm:inline">{section.label}</span>
            {section.count > 0 && (
              <span className="ml-1 text-[10px] bg-text/10 px-1.5 rounded-full">
                {section.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-text/50 text-sm">Loading...</div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Chats Section */}
            {sidebarSection === 'chats' && (
              <motion.div
                key="chats"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="py-2"
              >
                {!workspaceId ? (
                  <div className="p-4 text-center text-text/50 text-sm">
                    Select a project to view chats
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-text/50 text-sm">
                    {searchQuery ? 'No chats found' : 'No chats yet'}
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div key={conv.id} className="relative">
                      <button
                        onClick={() => onSelectConversation?.(conv.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-text/5 transition-colors group ${
                          activeConversationId === conv.id ? 'bg-accent/10 border-l-2 border-accent' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              activeConversationId === conv.id ? 'text-accent' : 'text-text'
                            }`}>
                              {conv.title || 'New conversation'}
                            </p>
                            <p className="text-xs text-text/50 mt-0.5">
                              {conv.messageCount} messages
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-text/40">
                              {formatDate(conv.updatedAt)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setMenuOpenId(menuOpenId === conv.id ? null : conv.id)
                              }}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-text/10 rounded transition-all"
                            >
                              <MoreVertical className="w-4 h-4 text-text/60" />
                            </button>
                          </div>
                        </div>
                      </button>

                      {/* Context Menu */}
                      <AnimatePresence>
                        {menuOpenId === conv.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-2 top-10 z-10 bg-background border border-text/10 rounded-sm shadow-lg py-1 min-w-[120px]"
                          >
                            <button
                              onClick={() => handleDeleteConversation(conv.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* Projects Section */}
            {sidebarSection === 'projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="py-2"
              >
                {filteredWorkspaces.length === 0 ? (
                  <div className="p-4 text-center text-text/50 text-sm">
                    {searchQuery ? 'No projects found' : 'No projects yet'}
                  </div>
                ) : (
                  filteredWorkspaces.map((ws) => (
                    <Link
                      key={ws.id}
                      href={`/app/workspaces/${ws.id}`}
                      className={`block px-4 py-3 hover:bg-text/5 transition-colors ${
                        workspaceId === ws.id ? 'bg-accent/10 border-l-2 border-accent' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            workspaceId === ws.id ? 'text-accent' : 'text-text'
                          }`}>
                            {ws.name}
                          </p>
                          {ws.description && (
                            <p className="text-xs text-text/50 mt-0.5 truncate">
                              {ws.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            ws.mode === 'core'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-text/10 text-text/60'
                          }`}
                        >
                          {ws.mode === 'core' ? 'Core' : 'Secure'}
                        </span>
                      </div>
                    </Link>
                  ))
                )}

                {/* Create New Project Link */}
                <Link
                  href="/app"
                  className="flex items-center gap-2 px-4 py-3 text-sm text-accent hover:bg-accent/5 transition-colors border-t border-text/10 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Project
                </Link>
              </motion.div>
            )}

            {/* Images Section */}
            {sidebarSection === 'images' && (
              <motion.div
                key="images"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="py-2"
              >
                {!workspaceId ? (
                  <div className="p-4 text-center text-text/50 text-sm">
                    Select a project to view images
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-4 text-center text-text/50 text-sm">
                    {searchQuery ? 'No images found' : 'No images uploaded'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 p-2">
                    {filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="aspect-square bg-text/5 rounded-sm flex items-center justify-center hover:bg-text/10 transition-colors cursor-pointer group"
                        title={doc.name}
                      >
                        <ImageIcon className="w-8 h-8 text-text/30 group-hover:text-text/50 transition-colors" aria-hidden="true" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-background">
        <Link
          href="/app"
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-text-muted hover:text-accent hover:bg-accent-light rounded-md transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
