import pdfParse from 'pdf-parse'
import { chunkTextSmart, type DocumentChunk } from '../chunking'

export interface PDFParseResult {
  text: string
  chunks: DocumentChunk[]
  metadata: {
    pageCount: number
    info?: {
      title?: string
      author?: string
      subject?: string
      creator?: string
    }
  }
}

/**
 * Parses a PDF file and extracts text content
 */
export async function parsePDF(fileBuffer: Buffer): Promise<PDFParseResult> {
  const pdfData = await pdfParse(fileBuffer)

  // Create chunks from text
  const chunks = chunkTextSmart(pdfData.text)

  return {
    text: pdfData.text,
    chunks,
    metadata: {
      pageCount: pdfData.numpages,
      info: pdfData.info,
    },
  }
}



