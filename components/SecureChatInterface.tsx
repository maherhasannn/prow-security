'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Send, Lock, Info } from 'lucide-react'
import DocumentSidebar from './DocumentSidebar'
import SessionTimer from './SessionTimer'

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
  const [tokensPerSecond, setTokensPerSecond] = useState<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const totalTokensStreamedRef = useRef<number>(0)
  const streamStartTimeRef = useRef<number | null>(null)
  const tokenUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

      // Use Ollama provider via API route
      const systemPrompt = `You are PROW, a secure AI assistant for analyzing sensitive business data. 
You have access to documents uploaded by the user. Use this information to answer questions accurately and securely.
Never expose sensitive information unnecessarily. Always cite which documents you are referencing.
Keep responses professional, clear, and focused on business insights.
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
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: normalizeText(msg.content) }
                      : msg
                  )
                )
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
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: normalizeText(msg.content) }
                : msg
            )
          )
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
      {/* Security Banner */}
      <div className="border-b border-text/10 bg-background-alt flex-shrink-0">
        <div className="px-6 py-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-text/70">
              <span className="text-base">🇺🇸</span>
              <span className="font-medium">All traffic kept in United States</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              {tokensPerSecond > 0 && (
                <div className="flex items-center gap-1.5 text-text/70">
                  <span className="font-medium">~{tokensPerSecond} tokens/s</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-text/60">
                <Info className="w-3.5 h-3.5" />
                <span>Chats auto-delete when navigating away</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
      </div>
    </div>
  )
}

