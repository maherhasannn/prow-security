import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents, documentChunks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth, getUserOrganizationId } from '@/lib/auth/middleware'
import { uploadDocumentSchema } from '@/lib/utils/validation'
import { handleError } from '@/lib/utils/errors'
import { uploadEncryptedFile } from '@/lib/storage/blob'
import { encrypt } from '@/lib/storage/encryption'
import { logAuditEvent, getClientIp, getClientUserAgent } from '@/lib/audit/logger'
import { requireDocumentUploadPermission } from '@/lib/rbac/checks'
import { parseExcel, parseCSV } from '@/lib/documents/processors/excel'
import { parsePDF } from '@/lib/documents/processors/pdf'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * POST /api/documents - Upload a document
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const organizationId = await getUserOrganizationId()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const workspaceId = formData.get('workspaceId') as string
    const name = formData.get('name') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate input
    const validated = uploadDocumentSchema.parse({ workspaceId, name })

    // Check permissions
    await requireDocumentUploadPermission(validated.workspaceId, organizationId, session.user.id)

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed size (50MB)' },
        { status: 400 }
      )
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    // Determine document type
    let documentType: 'excel' | 'csv' | 'pdf'
    let mimeType = file.type

    if (fileExtension === 'pdf' || mimeType === 'application/pdf') {
      documentType = 'pdf'
      mimeType = 'application/pdf'
    } else if (fileExtension === 'csv' || mimeType === 'text/csv') {
      documentType = 'csv'
      mimeType = 'text/csv'
    } else if (
      ['xlsx', 'xls'].includes(fileExtension || '') ||
      mimeType?.includes('spreadsheet') ||
      mimeType?.includes('excel')
    ) {
      documentType = 'excel'
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Supported types: PDF, Excel, CSV' },
        { status: 400 }
      )
    }

    // Upload encrypted file to blob storage
    const blobResult = await uploadEncryptedFile(
      fileBuffer,
      `${organizationId}/${validated.workspaceId}/${Date.now()}-${file.name}`,
      {
        organizationId,
        contentType: mimeType,
      }
    )

    // Create document record
    const [document] = await db
      .insert(documents)
      .values({
        workspaceId: validated.workspaceId,
        organizationId,
        name: validated.name || file.name,
        type: documentType,
        blobUrl: blobResult.url,
        fileSize: file.size,
        mimeType,
        encryptionKeyId: blobResult.encryptionKeyId,
        metadata: {
          iv: blobResult.iv,
          tag: blobResult.tag,
          originalFileName: file.name,
        },
        createdBy: session.user.id,
      })
      .returning()

    // Process document asynchronously (in background)
    // In production, you might want to use a queue system
    processDocument(document.id, fileBuffer, documentType, organizationId).catch(
      (error) => {
        console.error('Error processing document:', error)
      }
    )

    // Log audit event
    await logAuditEvent({
      organizationId,
      userId: session.user.id,
      action: 'document_upload',
      resourceType: 'document',
      resourceId: document.id,
      metadata: {
        name: document.name,
        type: documentType,
        size: file.size,
      },
      ipAddress: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

/**
 * Process document and create chunks (async)
 */
async function processDocument(
  documentId: string,
  fileBuffer: Buffer,
  documentType: 'excel' | 'csv' | 'pdf',
  organizationId: string
) {
  try {
    let chunks: Array<{ content: string; chunkIndex: number; metadata?: Record<string, unknown> }>

    // Parse document based on type
    if (documentType === 'pdf') {
      const result = await parsePDF(fileBuffer)
      chunks = result.chunks
    } else if (documentType === 'csv') {
      const result = await parseCSV(fileBuffer)
      chunks = result.chunks
    } else {
      const result = await parseExcel(fileBuffer)
      chunks = result.chunks
    }

    // Encrypt and store chunks
    const chunkInserts = chunks.map((chunk) => {
      const encrypted = encrypt(chunk.content, organizationId)
      return {
        documentId,
        chunkIndex: chunk.chunkIndex,
        content: JSON.stringify(encrypted), // Store encrypted data as JSON
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
      .where(eq(documents.id, documentId))
  } catch (error) {
    console.error('Error processing document:', error)
    // You might want to update document status to 'failed' here
  }
}



