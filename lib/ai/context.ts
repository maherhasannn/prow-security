import { db } from '@/lib/db'
import { documentChunks, documents } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { decrypt } from '@/lib/storage/encryption'
import { type AIMessage } from './providers/base'

/**
 * Builds context from workspace documents for AI queries
 */
export async function buildDocumentContext(
  workspaceId: string,
  organizationId: string,
  documentIds?: string[],
  maxChunks: number = 10
): Promise<string> {
  let chunksQuery = db
    .select({
      chunk: documentChunks,
      document: documents,
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(
      and(
        eq(documents.workspaceId, workspaceId),
        eq(documents.organizationId, organizationId),
        documents.processedAt !== null
      )
    )

  // Filter by specific documents if provided
  if (documentIds && documentIds.length > 0) {
    chunksQuery = chunksQuery.where(
      inArray(documents.id, documentIds)
    ) as typeof chunksQuery
  }

  const results = await chunksQuery
    .orderBy(documentChunks.chunkIndex)
    .limit(maxChunks)

  // Decrypt and format chunks
  const contextParts: string[] = []

  for (const result of results) {
    try {
      const encryptedData = JSON.parse(result.chunk.content) as {
        encrypted: string
        iv: string
        tag: string
      }

      const decryptedContent = decrypt(
        encryptedData.encrypted,
        encryptedData.iv,
        encryptedData.tag,
        organizationId
      )

      contextParts.push(
        `[Document: ${result.document.name}]\n${decryptedContent}\n`
      )
    } catch (error) {
      console.error('Error decrypting chunk:', error)
      // Skip this chunk if decryption fails
    }
  }

  return contextParts.join('\n---\n\n')
}

/**
 * Builds AI messages with document context
 */
export async function buildAIMessages(
  userMessage: string,
  workspaceId: string,
  organizationId: string,
  documentIds?: string[],
  systemPrompt?: string
): Promise<AIMessage[]> {
  const messages: AIMessage[] = []

  // System prompt
  const defaultSystemPrompt = `You are PROW, a secure AI assistant for analyzing sensitive business data. 
You have access to documents uploaded by the user. Use this information to answer questions accurately and securely.
Never expose sensitive information unnecessarily. Always cite which documents you're referencing.`

  messages.push({
    role: 'system',
    content: systemPrompt || defaultSystemPrompt,
  })

  // Build document context
  const context = await buildDocumentContext(workspaceId, organizationId, documentIds)

  if (context) {
    // Add context as a system message or prepend to user message
    const contextualUserMessage = context
      ? `Context from documents:\n\n${context}\n\n---\n\nUser question: ${userMessage}`
      : userMessage

    messages.push({
      role: 'user',
      content: contextualUserMessage,
    })
  } else {
    messages.push({
      role: 'user',
      content: userMessage,
    })
  }

  return messages
}

