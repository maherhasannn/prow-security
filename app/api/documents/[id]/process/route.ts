import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents, documentChunks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { handleError, NotFoundError } from '@/lib/utils/errors'
import { downloadAndDecryptFile } from '@/lib/storage/blob'
import { decrypt } from '@/lib/storage/encryption'
import { parseExcel, parseCSV } from '@/lib/documents/processors/excel'
import { parsePDF } from '@/lib/documents/processors/pdf'

/**
 * POST /api/documents/[id]/process - Manually trigger document processing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const [document] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, params.id),
          eq(documents.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!document) {
      throw new NotFoundError('Document')
    }

    // Download and decrypt file
    const metadata = document.metadata as { iv: string; tag: string } | null
    if (!metadata?.iv || !metadata?.tag) {
      return NextResponse.json(
        { error: 'Document encryption metadata missing' },
        { status: 400 }
      )
    }

    const fileBuffer = await downloadAndDecryptFile(
      document.blobUrl,
      metadata.iv,
      metadata.tag,
      organizationId
    )

    // Process document
    let chunks: Array<{ content: string; chunkIndex: number; metadata?: Record<string, unknown> }>

    if (document.type === 'pdf') {
      const result = await parsePDF(fileBuffer)
      chunks = result.chunks
    } else if (document.type === 'csv') {
      const result = await parseCSV(fileBuffer)
      chunks = result.chunks
    } else {
      const result = await parseExcel(fileBuffer)
      chunks = result.chunks
    }

    // Delete existing chunks
    await db.delete(documentChunks).where(eq(documentChunks.documentId, document.id))

    // Encrypt and store new chunks
    const chunkInserts = chunks.map((chunk) => {
      const encrypted = encrypt(chunk.content, organizationId)
      return {
        documentId: document.id,
        chunkIndex: chunk.chunkIndex,
        content: JSON.stringify(encrypted),
        metadata: chunk.metadata,
      }
    })

    // Insert chunks in batches
    const batchSize = 100
    for (let i = 0; i < chunkInserts.length; i += batchSize) {
      const batch = chunkInserts.slice(i, i + batchSize)
      await db.insert(documentChunks).values(batch)
    }

    // Mark document as processed
    await db
      .update(documents)
      .set({ processedAt: new Date() })
      .where(eq(documents.id, document.id))

    return NextResponse.json({
      success: true,
      chunksProcessed: chunks.length,
    })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

