'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Send, Lock, Globe, FileText, Home, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import DocumentSidebar from './DocumentSidebar'
import NotesOverlay from './NotesOverlay'
import LeftSidebar from './LeftSidebar'
import SessionTimer from './SessionTimer'
import { useNavigation } from '@/contexts/NavigationContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  saved?: boolean
}

interface SecureChatInterfaceProps {
  workspaceId: string
  workspaceName: string
  workspaceMode: 'secure' | 'core'
}

export default function SecureChatInterface({
  workspaceId,
  workspaceName,
  workspaceMode,
}: SecureChatInterfaceProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { setCurrentWorkspace } = useNavigation()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [tokensPerSecond, setTokensPerSecond] = useState<number>(0)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0)
  const [notesOverlayOpen, setNotesOverlayOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const totalTokensStreamedRef = useRef<number>(0)
  const streamStartTimeRef = useRef<number | null>(null)
  const tokenUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pendingMessagesRef = useRef<Message[]>([])

  // Set current workspace in navigation context
  useEffect(() => {
    setCurrentWorkspace({ id: workspaceId, name: workspaceName })
    return () => setCurrentWorkspace(null)
  }, [workspaceId, workspaceName, setCurrentWorkspace])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Create a new conversation
  const createConversation = useCallback(async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (response.ok) {
        const data = await response.json()
        return data.conversation.id
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
    return null
  }, [workspaceId])

  // Save messages to the conversation
  const saveMessages = useCallback(async (conversationId: string, messagesToSave: Message[]) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSave.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })
      if (response.ok) {
        // Mark messages as saved
        setMessages(prev => prev.map(m =>
          messagesToSave.find(ms => ms.id === m.id) ? { ...m, saved: true } : m
        ))
        // Trigger sidebar refresh to show the updated conversation
        setSidebarRefreshTrigger(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error saving messages:', error)
    }
  }, [workspaceId])

  // Load messages for a conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    setConversationLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        const loadedMessages: Message[] = data.messages.map((m: { id: string; role: 'user' | 'assistant'; content: string; createdAt: string }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt),
          saved: true,
        }))
        setMessages(loadedMessages)
        setActiveConversationId(conversationId)
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    } finally {
      setConversationLoading(false)
    }
  }, [workspaceId])

  // Handle selecting a conversation
  const handleSelectConversation = useCallback((conversationId: string | null) => {
    if (conversationId === null) {
      // Start new conversation
      setMessages([])
      setActiveConversationId(null)
    } else {
      loadConversation(conversationId)
    }
  }, [loadConversation])

  // Handle starting a new conversation
  const handleNewConversation = useCallback(() => {
    setMessages([])
    setActiveConversationId(null)
  }, [])

  // Normalize text formatting: clean up whitespace while preserving line breaks
  const normalizeText = (text: string): string => {
    if (!text) return text
    
    return text
      .split('\n')                    // Split by line breaks
      .map(line => line.trimEnd())    // Remove trailing spaces per line
      .join('\n')                     // Rejoin with preserved line breaks
      .replace(/[ \t]+/g, ' ')        // Normalize multiple spaces/tabs to single space
      .trim()                         // Trim leading/trailing whitespace
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      saved: false,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Create conversation if this is the first message
    let conversationId = activeConversationId
    if (!conversationId) {
      conversationId = await createConversation()
      if (conversationId) {
        setActiveConversationId(conversationId)
      }
    }

    try {
      // Build context from selected documents
      let context = ''
      if (selectedDocuments.length > 0) {
        context = `Context: User has selected ${selectedDocuments.length} document(s) for reference.`
      }

      // Use Ollama provider via API route
const systemPrompt = `You are PROW, a secure AI assistant for analyzing sensitive business data.
You have access to documents uploaded by the user. Use this information to answer questions accurately and securely.
Never expose sensitive information unnecessarily. Always cite which documents you are referencing.
Keep responses professional, clear, and focused on business insights. Do not share information date cutoffs.
${workspaceMode === 'core'
  ? 'You can access the public internet using Google Search grounding. When you use web sources, cite the sources clearly.'
  : 'You do not have internet access. Do not claim to browse or search the web.'}
${context}`

      // Create placeholder assistant message for streaming
      const assistantMessageId = (Date.now() + 1).toString()
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      // Add placeholder message immediately
      setMessages((prev) => [...prev, assistantMessage])

      // Reset token tracking for new stream
      totalTokensStreamedRef.current = 0
      streamStartTimeRef.current = Date.now()
      setTokensPerSecond(0)

      // Clear any existing token update interval
      if (tokenUpdateIntervalRef.current) {
        clearInterval(tokenUpdateIntervalRef.current)
      }

      // Set up interval to update tokens per second display
      tokenUpdateIntervalRef.current = setInterval(() => {
        if (streamStartTimeRef.current) {
          const elapsedSeconds = (Date.now() - streamStartTimeRef.current) / 1000
          if (elapsedSeconds > 0 && totalTokensStreamedRef.current > 0) {
            const rate = Math.round(totalTokensStreamedRef.current / elapsedSeconds)
            setTokensPerSecond(rate)
          }
        }
      }, 100) // Update every 100ms for smooth display

      // Call our API route with streaming enabled (API key is handled server-side)
      const apiResponse = await fetch('/api/ai/chat?stream=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage.content },
          ],
          model: 'gpt-oss:120b-cloud',
          workspaceId: workspaceId,
          stream: true,
        }),
      })

      if (!apiResponse.ok) {
        // Remove placeholder message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId))
        const errorData = await apiResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${apiResponse.statusText}`)
      }

      // Handle streaming response
      const reader = apiResponse.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as {
                chunk?: string
                done?: boolean
                error?: string
              }

              if (data.error) {
                throw new Error(data.error)
              }

              if (data.chunk !== undefined) {
                // Estimate tokens: roughly 1 token ≈ 4 characters for English text
                const chunkText = data.chunk || ''
                const estimatedTokens = Math.ceil(chunkText.length / 4)
                totalTokensStreamedRef.current += estimatedTokens

                // Update tokens per second display
                if (streamStartTimeRef.current) {
                  const elapsedSeconds = (Date.now() - streamStartTimeRef.current) / 1000
                  if (elapsedSeconds > 0) {
                    const rate = Math.round(totalTokensStreamedRef.current / elapsedSeconds)
                    setTokensPerSecond(rate)
                  }
                }

                // Update message content incrementally
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + chunkText }
                      : msg
                  )
                )
              }

              if (data.done) {
                // Streaming complete - normalize text formatting
                let finalAssistantContent = ''
                setMessages((prev) => {
                  const updated = prev.map((msg) => {
                    if (msg.id === assistantMessageId) {
                      finalAssistantContent = normalizeText(msg.content)
                      return { ...msg, content: finalAssistantContent }
                    }
                    return msg
                  })
                  return updated
                })

                // Save messages to conversation
                if (conversationId && finalAssistantContent) {
                  const assistantMsg: Message = {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: finalAssistantContent,
                    timestamp: new Date(),
                    saved: false,
                  }
                  saveMessages(conversationId, [userMessage, assistantMsg])
                }

                // Clear token tracking
                if (tokenUpdateIntervalRef.current) {
                  clearInterval(tokenUpdateIntervalRef.current)
                  tokenUpdateIntervalRef.current = null
                }
                streamStartTimeRef.current = null
                // Keep final tokensPerSecond visible for a moment, then reset
                setTimeout(() => {
                  setTokensPerSecond(0)
                  totalTokensStreamedRef.current = 0
                }, 2000)
                break
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              console.warn('Failed to parse streaming chunk:', line)
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        const lines = buffer.split('\n')
        let isDone = false
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as {
                chunk?: string
                done?: boolean
              }

              if (data.chunk !== undefined) {
                // Estimate tokens: roughly 1 token ≈ 4 characters for English text
                const chunkText = data.chunk || ''
                const estimatedTokens = Math.ceil(chunkText.length / 4)
                totalTokensStreamedRef.current += estimatedTokens

                // Update tokens per second display
                if (streamStartTimeRef.current) {
                  const elapsedSeconds = (Date.now() - streamStartTimeRef.current) / 1000
                  if (elapsedSeconds > 0) {
                    const rate = Math.round(totalTokensStreamedRef.current / elapsedSeconds)
                    setTokensPerSecond(rate)
                  }
                }

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + chunkText }
                      : msg
                  )
                )
              }

              if (data.done) {
                isDone = true
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }

        // Normalize text if done was found in buffer
        if (isDone) {
          let finalAssistantContent = ''
          setMessages((prev) => {
            const updated = prev.map((msg) => {
              if (msg.id === assistantMessageId) {
                finalAssistantContent = normalizeText(msg.content)
                return { ...msg, content: finalAssistantContent }
              }
              return msg
            })
            return updated
          })

          // Save messages to conversation
          if (conversationId && finalAssistantContent) {
            const assistantMsg: Message = {
              id: assistantMessageId,
              role: 'assistant',
              content: finalAssistantContent,
              timestamp: new Date(),
              saved: false,
            }
            saveMessages(conversationId, [userMessage, assistantMsg])
          }

          // Clear token tracking
          if (tokenUpdateIntervalRef.current) {
            clearInterval(tokenUpdateIntervalRef.current)
            tokenUpdateIntervalRef.current = null
          }
          streamStartTimeRef.current = null
          // Keep final tokensPerSecond visible for a moment, then reset
          setTimeout(() => {
            setTokensPerSecond(0)
            totalTokensStreamedRef.current = 0
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      let errorContent = 'Sorry, I encountered an error. Please try again.'
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes('api key') || errorMsg.includes('not configured')) {
          errorContent = 'Ollama API key not configured. Please configure OLLAMA_API_KEY environment variable on the server.'
        } else if (errorMsg.includes('quota') || errorMsg.includes('limit')) {
          errorContent = 'API quota exceeded. Please check your Ollama API usage limits.'
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          errorContent = 'Network error. Please check your connection and try again.'
        } else {
          errorContent = `Error: ${error.message}`
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      
      // Clear token tracking on error
      if (tokenUpdateIntervalRef.current) {
        clearInterval(tokenUpdateIntervalRef.current)
        tokenUpdateIntervalRef.current = null
      }
      streamStartTimeRef.current = null
      setTokensPerSecond(0)
      totalTokensStreamedRef.current = 0
    } finally {
      setLoading(false)
    }
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (tokenUpdateIntervalRef.current) {
        clearInterval(tokenUpdateIntervalRef.current)
      }
    }
  }, [])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Consolidated Top Bar */}
      <header className="border-b border-text/10 bg-background-alt flex-shrink-0">
        <div className="px-4 py-2.5">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo + Workspace Name */}
            <div className="flex items-center gap-3">
              <Link
                href="/app"
                className="flex items-center gap-2 text-text hover:text-accent transition-colors group"
                title="Back to Dashboard"
              >
                <div className="w-8 h-8 bg-accent group-hover:bg-accent-hover rounded-md flex items-center justify-center transition-colors">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-heading font-bold tracking-tight hidden sm:inline">PROW</span>
              </Link>

              <ChevronRight className="w-4 h-4 text-text/30 hidden sm:block" />

              <div className="flex items-center gap-2">
                <h1 className="text-base font-heading font-semibold text-text">{workspaceName}</h1>
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                    workspaceMode === 'core'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-accent/10 text-accent'
                  }`}
                >
                  {workspaceMode === 'core' ? (
                    <Globe className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  <span>{workspaceMode === 'core' ? 'Core' : 'Secure'}</span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {tokensPerSecond > 0 && (
                <div className="hidden sm:flex items-center gap-1 text-text/60 text-xs px-2 py-1 bg-text/5 rounded">
                  <span className="font-medium">~{tokensPerSecond} tok/s</span>
                </div>
              )}

              <button
                onClick={() => setNotesOverlayOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded hover:bg-accent/20 transition-colors"
              >
                <FileText className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium text-accent hidden sm:inline">Notes</span>
              </button>

              <SessionTimer />

              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                <Lock className="w-3 h-3" />
                <span className="font-medium">Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
          workspaceId={workspaceId}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          refreshTrigger={sidebarRefreshTrigger}
        />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {conversationLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                  <p className="text-text/60 text-sm">Loading conversation...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-heading font-semibold mb-2">
                    Start a Secure Conversation
                  </h2>
                  <p className="text-text/70 text-sm mb-4">
                    Ask questions about your documents or get insights from your data.
                    All conversations are saved automatically.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-text/60">
                    <Lock className="w-4 h-4" />
                    <span>End-to-end encrypted • No data training</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] ${
                        message.role === 'user'
                          ? 'bg-text/5 border border-text/10'
                          : 'bg-background-alt border border-text/10'
                      } rounded-sm p-4`}
                    >
                      {message.role === 'user' ? (
                        <div className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                      ) : (
                        <div className="text-sm text-text leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-pre:bg-text/5 prose-pre:p-3 prose-pre:rounded prose-code:text-accent prose-code:bg-text/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      )}
                      <div className="text-xs text-text/50 mt-2">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-background-alt border border-text/10 rounded-sm p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-text/40 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-text/40 rounded-full animate-pulse delay-75" />
                    <div className="w-2 h-2 bg-text/40 rounded-full animate-pulse delay-150" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-text/10 bg-background-alt p-4 flex-shrink-0">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  rows={1}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ minHeight: '48px', maxHeight: '200px' }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-text text-background font-medium rounded-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
            {selectedDocuments.length > 0 && (
              <div className="mt-2 text-xs text-text/60">
                {selectedDocuments.length} document(s) selected for context
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Documents */}
        <div className="w-72 flex-shrink-0 flex flex-col border-l border-text/10">
          <div className="flex-1 overflow-hidden">
            <DocumentSidebar
              workspaceId={workspaceId}
              selectedDocuments={selectedDocuments}
              onSelectDocument={(docId) => {
                setSelectedDocuments((prev) =>
                  prev.includes(docId)
                    ? prev.filter((id) => id !== docId)
                    : [...prev, docId]
                )
              }}
            />
          </div>
        </div>
      </div>

      {/* Notes Overlay */}
      <NotesOverlay
        isOpen={notesOverlayOpen}
        onClose={() => setNotesOverlayOpen(false)}
        workspaceId={workspaceId}
      />
    </div>
  )
}

