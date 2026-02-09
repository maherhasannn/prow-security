'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit2,
  Archive,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Conversation {
  id: string
  title: string | null
  status: 'active' | 'completed' | 'archived'
  messageCount: number
  createdAt: string
  updatedAt: string
}

interface ConversationSidebarProps {
  workspaceId: string
  activeConversationId: string | null
  onSelectConversation: (conversationId: string | null) => void
  onNewConversation: () => void
}

export default function ConversationSidebar({
  workspaceId,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/conversations`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Refresh conversations when active conversation changes (new messages might have updated title)
  useEffect(() => {
    if (activeConversationId) {
      fetchConversations()
    }
  }, [activeConversationId, fetchConversations])

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/conversations/${conversationId}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        if (activeConversationId === conversationId) {
          onSelectConversation(null)
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
    setMenuOpenId(null)
  }

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/conversations/${conversationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'archived' }),
        }
      )
      if (response.ok) {
        fetchConversations()
      }
    } catch (error) {
      console.error('Error archiving conversation:', error)
    }
    setMenuOpenId(null)
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return conv.status !== 'archived'
    const title = conv.title || 'New conversation'
    return title.toLowerCase().includes(searchQuery.toLowerCase()) && conv.status !== 'archived'
  })

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

  if (collapsed) {
    return (
      <div className="w-12 bg-background-alt border-r border-text/10 h-full flex flex-col">
        <button
          onClick={() => setCollapsed(false)}
          className="p-3 hover:bg-text/5 transition-colors"
          title="Expand conversations"
        >
          <ChevronRight className="w-5 h-5 text-text/60" />
        </button>
        <button
          onClick={onNewConversation}
          className="p-3 hover:bg-text/5 transition-colors"
          title="New conversation"
        >
          <Plus className="w-5 h-5 text-text/60" />
        </button>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.slice(0, 10).map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`w-full p-3 hover:bg-text/5 transition-colors ${
                activeConversationId === conv.id ? 'bg-accent/10' : ''
              }`}
              title={conv.title || 'New conversation'}
            >
              <MessageSquare className={`w-5 h-5 ${
                activeConversationId === conv.id ? 'text-accent' : 'text-text/60'
              }`} />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-72 bg-background-alt border-r border-text/10 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-text/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-sm">Conversations</h3>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 hover:bg-text/5 rounded transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4 text-text/60" />
          </button>
        </div>

        {/* New Conversation Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewConversation}
          className="w-full flex items-center gap-2 px-3 py-2 bg-text text-background text-sm font-medium rounded-sm hover:bg-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </motion.button>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/40" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background border border-text/10 rounded-sm text-sm placeholder:text-text/40 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-text/50 text-sm">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-text/50 text-sm">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="py-2">
            <AnimatePresence>
              {filteredConversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="relative"
                >
                  <button
                    onClick={() => onSelectConversation(conv.id)}
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
                        className="absolute right-2 top-10 z-10 bg-background border border-text/10 rounded-sm shadow-lg py-1 min-w-[140px]"
                      >
                        <button
                          onClick={() => handleArchiveConversation(conv.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text/70 hover:bg-text/5 transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                          Archive
                        </button>
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
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-text/10">
        <p className="text-xs text-text/40 text-center">
          {conversations.filter(c => c.status !== 'archived').length} conversations
        </p>
      </div>
    </div>
  )
}
