'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Send, Lock, Key } from 'lucide-react'
import DocumentSidebar from './DocumentSidebar'
import SessionTimer from './SessionTimer'
import ApiKeyConfig from './ApiKeyConfig'
// Removed direct GeminiProvider import - using API route instead

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SecureChatInterfaceProps {
  workspaceId: string
  workspaceName: string
}

const GEMINI_API_KEY_STORAGE_KEY = 'prow_gemini_api_key'

export default function SecureChatInterface({
  workspaceId,
  workspaceName,
}: SecureChatInterfaceProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check for API key
    const storedKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)
    if (storedKey) {
      setApiKey(storedKey)
    } else {
      setIsApiKeyModalOpen(true)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleApiKeySave = (key: string) => {
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key)
    setApiKey(key)
    setIsApiKeyModalOpen(false)
  }

  const handleSend = async () => {
    if (!input.trim() || loading || !apiKey) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Build context from selected documents
      let context = ''
      if (selectedDocuments.length > 0) {
        context = `Context: User has selected ${selectedDocuments.length} document(s) for reference.`
      }

      // Use Gemini provider directly
      const systemPrompt = `You are PROW, a secure AI assistant for analyzing sensitive business data. 
You have access to documents uploaded by the user. Use this information to answer questions accurately and securely.
Never expose sensitive information unnecessarily. Always cite which documents you are referencing.
Keep responses professional, clear, and focused on business insights.
${context}`

      // Call our API route instead of calling Gemini directly (avoids CORS issues)
      const apiResponse = await fetch('/api/ai/chat', {
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
          model: 'gemini-1.5-flash',
          apiKey: apiKey,
          workspaceId: workspaceId,
        }),
      })

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${apiResponse.statusText}`)
      }

      const data = await apiResponse.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      let errorContent = 'Sorry, I encountered an error. Please check your API key and try again.'
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes('api key') || errorMsg.includes('unauthorized')) {
          errorContent = 'Invalid API key. Please configure your Gemini API key in settings.'
        } else if (errorMsg.includes('quota') || errorMsg.includes('limit')) {
          errorContent = 'API quota exceeded. Please check your Gemini API usage limits.'
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
    } finally {
      setLoading(false)
    }
  }

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
      {/* Header */}
      <header className="border-b border-text/10 bg-background-alt flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/app')}
                className="p-2 hover:bg-background rounded-sm transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text/60" />
              </button>
              <div>
                <h1 className="text-lg font-heading font-bold">{workspaceName}</h1>
                <p className="text-xs text-text/60">Secure AI Workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <SessionTimer />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/5 border border-accent/20 rounded-sm">
                <Lock className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-medium text-accent">Encrypted</span>
              </div>
              <button
                onClick={() => setIsApiKeyModalOpen(true)}
                className="p-2 hover:bg-background rounded-sm transition-colors"
                title="Configure API Key"
              >
                <Key className="w-5 h-5 text-text/60" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Sidebar */}
        <div className="w-64 flex-shrink-0">
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

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-heading font-semibold mb-2">
                    Start a Secure Conversation
                  </h2>
                  <p className="text-text/70 text-sm mb-4">
                    Ask questions about your documents or get insights from your data.
                    All conversations are encrypted and logged.
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
                      <div className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
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
                  disabled={loading || !apiKey}
                  className="w-full px-4 py-3 bg-background border border-text/20 rounded-sm text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ minHeight: '48px', maxHeight: '200px' }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={loading || !input.trim() || !apiKey}
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
      </div>

      {/* API Key Config Modal */}
      <ApiKeyConfig
        isOpen={isApiKeyModalOpen}
        onClose={() => {
          if (apiKey) {
            setIsApiKeyModalOpen(false)
          }
        }}
        onSave={handleApiKeySave}
        currentApiKey={apiKey || undefined}
      />
    </div>
  )
}

